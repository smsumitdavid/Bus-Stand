import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../src/services/firebaseConfig';
import { COLORS } from '../../src/constants/theme';

export default function BusListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const searchFrom = (params.from as string)?.toLowerCase()?.trim() || '';
  const searchTo = (params.to as string)?.toLowerCase()?.trim() || '';
  const searchBusName = (params.busName as string)?.toLowerCase()?.trim() || '';

  const [loading, setLoading] = useState(true);
  const [buses, setBuses] = useState<any[]>([]);

  useEffect(() => { fetchBuses(); }, [searchFrom, searchTo, searchBusName]);

  // ⏱️ TIME HELPER
  const parseMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (hours !== 12 && modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
  };

  const getDurationString = (startStr: string, endStr: string) => {
    if(!startStr || !endStr) return "--";
    let min1 = parseMinutes(startStr);
    let min2 = parseMinutes(endStr);
    
    let diff = min2 - min1;
    if (diff < 0) diff += 24 * 60; // Overnight
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}hr ${m}m`;
  };

  const fetchBuses = async () => {
    try {
      const q = query(collection(db, 'buses'));
      const querySnapshot = await getDocs(q);
      const filteredBuses: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Construct Forward Route for Indexing
        // Note: stops usually includes start/end in DB, but we handle carefully
        const stops = data.stoppages || [];
        
        // 1. NAME SEARCH
        if (searchBusName) {
            if (data.busName?.toLowerCase().includes(searchBusName) || data.busNo?.toLowerCase().includes(searchBusName)) {
                filteredBuses.push({
                    id: doc.id, ...data, isReturn: false,
                    displayStart: data.startStand, displayStartTime: data.startTime,
                    displayEnd: data.endStand, displayEndTime: data.endTime,
                    displayPrice: data.mainPrice || '',
                    tripDuration: getDurationString(data.startTime, data.endTime)
                });
            }
            return;
        }

        // 2. ROUTE SEARCH
        if (searchFrom && searchTo) {
            // Find Indexes based on Name
            const fromIndex = stops.findIndex((s: any) => s.name?.toLowerCase().trim() === searchFrom);
            const toIndex = stops.findIndex((s: any) => s.name?.toLowerCase().trim() === searchTo);

            // Special Case: If user types "Jahanabad" (End Stand) as Start
            const isMainEndStart = data.endStand?.toLowerCase().trim() === searchFrom;
            const isMainStartEnd = data.startStand?.toLowerCase().trim() === searchTo;

            // Resolve Indexes using Main Stands if not found in stops array
            let finalFromIndex = fromIndex;
            let finalToIndex = toIndex;

            // If start/end not found in stops, check if they match main stands
            if (finalFromIndex === -1 && data.startStand?.toLowerCase().trim() === searchFrom) finalFromIndex = 0;
            if (finalFromIndex === -1 && isMainEndStart) finalFromIndex = stops.length - 1;
            
            if (finalToIndex === -1 && data.endStand?.toLowerCase().trim() === searchTo) finalToIndex = stops.length - 1;
            if (finalToIndex === -1 && isMainStartEnd) finalToIndex = 0;

            if (finalFromIndex !== -1 && finalToIndex !== -1) {
                
                // ➡ FORWARD TRIP
                if (finalFromIndex < finalToIndex) {
                    const sNode = stops[finalFromIndex];
                    const eNode = stops[finalToIndex];
                    
                    // Show Price ONLY if Main Start -> Main End
                    const isFullTrip = (finalFromIndex === 0 && finalToIndex === stops.length - 1);
                    const showPrice = isFullTrip ? data.mainPrice : '';

                    filteredBuses.push({
                        id: doc.id, ...data, isReturn: false,
                        displayStart: sNode.name, displayStartTime: sNode.time,
                        displayEnd: eNode.name, displayEndTime: eNode.time,
                        displayPrice: showPrice,
                        tripDuration: getDurationString(sNode.time, eNode.time)
                    });
                }
                
                // ⬅ REVERSE TRIP
                else if (finalFromIndex > finalToIndex && data.returnStartTime) {
                    
                    let sTime = '', eTime = '';
                    
                    // GET START TIME
                    // If starting from Main End (Jahanabad), use returnStartTime
                    if (finalFromIndex === stops.length - 1) sTime = data.returnStartTime;
                    else sTime = stops[finalFromIndex].returnTime || ''; // Use Return Time from DB

                    // GET END TIME
                    // If ending at Main Start (Patna), use returnEndTime
                    if (finalToIndex === 0) eTime = data.returnEndTime;
                    else eTime = stops[finalToIndex].returnTime || '';

                    // Show Price ONLY if Main End -> Main Start
                    const isFullReturn = (finalFromIndex === stops.length - 1 && finalToIndex === 0);
                    const showPrice = isFullReturn ? (data.returnPrice || data.mainPrice) : '';

                    filteredBuses.push({
                        id: doc.id, ...data, isReturn: true,
                        displayStart: stops[finalFromIndex].name, displayStartTime: sTime,
                        displayEnd: stops[finalToIndex].name, displayEndTime: eTime,
                        displayPrice: showPrice,
                        tripDuration: getDurationString(sTime, eTime)
                    });
                }
            }
        }
      });
      setBuses(filteredBuses);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const renderBusItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/bus/[id]", params: { id: item.id, fromStand: item.displayStart, toStand: item.displayEnd, isReturnTrip: item.isReturn ? 'true' : 'false' } })}>
      <View style={styles.cardHeader}><View style={{flexDirection:'row', alignItems:'center'}}><Ionicons name="bus" size={18} color={COLORS.primary} style={{marginRight: 8}} /><Text style={styles.busName}>{item.busName}</Text></View><Text style={styles.busNumber}>{item.busNo}</Text></View>
      <View style={styles.journeyRow}>
        <View style={{flex: 1}}><Text style={styles.stationCode}>{item.displayStart?.substring(0,3).toUpperCase()}</Text><Text style={styles.time}>{item.displayStartTime}</Text><Text style={styles.stationName} numberOfLines={1}>{item.displayStart}</Text></View>
        <View style={styles.centerVisual}><Text style={styles.duration}>{item.tripDuration}</Text><View style={styles.dottedLine} /></View>
        <View style={{flex: 1, alignItems: 'flex-end'}}><Text style={styles.stationCode}>{item.displayEnd?.substring(0,3).toUpperCase()}</Text><Text style={styles.time}>{item.displayEndTime}</Text><Text style={styles.stationName} numberOfLines={1}>{item.displayEnd}</Text></View>
      </View>
      <View style={styles.cardFooter}>
          <View style={styles.daysRow}>{['S','M','T','W','T','F','S'].map((day, idx) => (<Text key={idx} style={[styles.dayText, { color: item.runDays && item.runDays[idx] ? COLORS.primary : '#E0E0E0' }]}>{day}</Text>))}</View>
          {item.displayPrice ? <Text style={styles.priceText}>₹ {item.displayPrice}</Text> : null}
      </View>
      <View style={styles.adBanner}><Text style={{fontWeight:'bold', color: COLORS.primary}}>Banner Ads</Text></View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="black" /></TouchableOpacity><Text style={styles.headerTitle}>{searchBusName ? `Search: ${searchBusName}` : `${params.from} to ${params.to}`}</Text></View>
      {loading ? (<View style={{marginTop: 50}}><ActivityIndicator size="large" color={COLORS.primary} /></View>) : (
        <FlatList data={buses} renderItem={renderBusItem} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16 }} ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="bus-outline" size={50} color="#DDD" /><Text style={styles.emptyText}>No buses found.</Text></View>}/>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', elevation: 2 },
  backBtn: { paddingRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize', flex: 1 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 3, borderWidth: 1, borderColor: '#F0F0F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  busName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  busNumber: { fontSize: 12, color: '#555', backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  journeyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  stationCode: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  time: { fontSize: 14, fontWeight: 'bold', color: '#000', marginTop: 2 },
  stationName: { fontSize: 12, color: COLORS.gray, marginTop: 2, textTransform: 'capitalize' },
  centerVisual: { flex: 1, alignItems: 'center', marginHorizontal: 15 },
  duration: { fontSize: 12, fontWeight:'bold', color: COLORS.primary, marginBottom: 5 },
  dottedLine: { width: '100%', height: 1, borderWidth: 1, borderColor: '#DDD', borderStyle: 'dashed', borderRadius: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayText: { fontSize: 10, fontWeight: 'bold' },
  priceText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  adBanner: { backgroundColor: COLORS.secondary, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray, marginTop: 10 },
});
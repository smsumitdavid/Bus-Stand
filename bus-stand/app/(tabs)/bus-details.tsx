import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, ActivityIndicator, Platform, Modal, FlatList, KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../src/services/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { COLORS } from '../../src/constants/theme';
import * as Location from 'expo-location';

// 🕒 Custom Time Picker
const CustomTimePicker = ({ visible, onClose, onSelect }: any) => {
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');

  if (!visible) return null;

  const handleConfirm = () => { onSelect(`${hour}:${minute} ${ampm}`); onClose(); };

  const renderItem = (item: string, current: string, setFn: any) => (
    <TouchableOpacity style={[styles.pickerItem, item === current && styles.pickerItemSelected]} onPress={() => setFn(item)}>
      <Text style={[styles.pickerText, item === current && styles.pickerTextSelected]}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Select Time</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}><Text style={styles.colHeader}>Hr</Text><FlatList data={['01','02','03','04','05','06','07','08','09','10','11','12']} keyExtractor={i=>i} renderItem={({item})=>renderItem(item,hour,setHour)} style={{height: 150}} showsVerticalScrollIndicator={false}/></View>
            <View style={styles.pickerColumn}><Text style={styles.colHeader}>Min</Text><FlatList data={['00','05','10','15','20','25','30','35','40','45','50','55']} keyExtractor={i=>i} renderItem={({item})=>renderItem(item,minute,setMinute)} style={{height: 150}} showsVerticalScrollIndicator={false}/></View>
            <View style={styles.pickerColumn}><Text style={styles.colHeader}>--</Text><FlatList data={['AM','PM']} keyExtractor={i=>i} renderItem={({item})=>renderItem(item,ampm,setAmpm)} style={{height: 150}} showsVerticalScrollIndicator={false}/></View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}><Text style={styles.confirmText}>Confirm Time</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function BusDetailsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Save Bus');
  const [user, setUser] = useState<any>(null);

  const [busName, setBusName] = useState('');
  const [busNo, setBusNo] = useState('');
  const [startStand, setStartStand] = useState('');
  const [startTime, setStartTime] = useState(''); 
  const [endStand, setEndStand] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [mainPrice, setMainPrice] = useState(''); 
  const [returnPrice, setReturnPrice] = useState('');

  const [returnStartTime, setReturnStartTime] = useState('');
  const [returnEndTime, setReturnEndTime] = useState('');
  
  const [selectedDays, setSelectedDays] = useState<boolean[]>(Array(7).fill(false));
  const daysLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const [stoppages, setStoppages] = useState([{ name: '', time: '', returnTime: '' }]);

  const [showPicker, setShowPicker] = useState(false);
  const [activeField, setActiveField] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.replace('/(auth)/login'); } 
      else { 
          setUser(currentUser); 
          await fetchExistingBus(currentUser.uid); 
          await Location.requestForegroundPermissionsAsync();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchExistingBus = async (uid: string) => {
    try {
      const docRef = doc(db, 'buses', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        setBusName(data.busName); setBusNo(data.busNo);
        setStartStand(data.startStand); setStartTime(data.startTime);
        setEndStand(data.endStand); setEndTime(data.endTime);
        setMainPrice(data.mainPrice || ''); 
        
        setSelectedDays(data.runDays || Array(7).fill(false));
        setReturnStartTime(data.returnStartTime || '');
        setReturnEndTime(data.returnEndTime || '');
        setReturnPrice(data.returnPrice || '');

        const displayStops = data.stoppages ? data.stoppages.filter((s: any) => !s.isStart && !s.isEnd) : [];
        const loadedStops = displayStops.map((s:any) => ({ name: s.name, time: s.time, returnTime: s.returnTime || '' }));
        setStoppages(loadedStops.length > 0 ? loadedStops : [{ name: '', time: '', returnTime: '' }]);
      }
    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Are you sure you want to logout?");
      if (confirm) { await signOut(auth); router.replace('/(auth)/login'); }
    } else {
      Alert.alert("Logout", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "Logout", style: "destructive", onPress: async () => { await signOut(auth); router.replace('/(auth)/login'); } }]);
    }
  };

  const openPicker = (field: any) => { setActiveField(field); setShowPicker(true); };
  
  const handleTimeSelect = (time: string) => {
    if (activeField === 'start') setStartTime(time);
    else if (activeField === 'end') setEndTime(time);
    else if (activeField === 'retStart') setReturnStartTime(time);
    else if (activeField === 'retEnd') setReturnEndTime(time);
    else if (typeof activeField === 'number') {
      const newStops = [...stoppages]; newStops[activeField].time = time; setStoppages(newStops);
    } 
    else if (typeof activeField === 'string' && activeField.startsWith('ret_')) {
      const idx = parseInt(activeField.split('_')[1]);
      const newStops = [...stoppages]; newStops[idx].returnTime = time; setStoppages(newStops);
    }
  };

  const toggleDay = (idx: number) => { const n = [...selectedDays]; n[idx] = !n[idx]; setSelectedDays(n); };
  const updateStoppage = (idx: number, f: string, v: string) => { const n = [...stoppages]; n[idx] = { ...n[idx], [f]: v }; setStoppages(n); };
  const addStoppage = () => setStoppages([...stoppages, { name: '', time: '', returnTime: '' }]);

  // 🌍 GEOCODING HELPER
  const getCoordinates = async (placeName: string) => {
      try {
          if (!placeName) return null;
          let query = placeName;
          if (busNo.toUpperCase().startsWith('BR')) { query += ", Bihar, India"; }
          const geocoded = await Location.geocodeAsync(query);
          if (geocoded && geocoded.length > 0) { return { lat: geocoded[0].latitude, lng: geocoded[0].longitude }; }
          return null;
      } catch (error) { console.log(`Geocode failed for ${placeName}`, error); return null; }
  };

  const handleSave = async () => {
    if (!busName || !startStand || !endStand || !mainPrice) { Alert.alert('Error', 'Please fill Bus Name, Route & End Price'); return; }
    
    setSaving(true);
    setStatusMsg('Checking Database...'); // Status updated

    try {
        const docRef = doc(db, 'buses', user.uid);
        
        // 1. 🔥 FETCH LATEST DATA FROM DB FIRST (To Preserve Manual Coords)
        const latestSnap = await getDoc(docRef);
        const latestData = latestSnap.exists() ? latestSnap.data() : null;

        // 🛡️ Helper to find existing coords in DB
        const findPreservedCoords = (name: string, type: 'start'|'end'|'stop') => {
            if (!latestData) return null;
            
            // Check Start Stand
            if (type === 'start' && latestData.startStand?.trim().toLowerCase() === name.trim().toLowerCase()) {
                return latestData.startCoords;
            }
            // Check End Stand
            if (type === 'end' && latestData.endStand?.trim().toLowerCase() === name.trim().toLowerCase()) {
                return latestData.endCoords;
            }
            // Check Stops Array
            if (latestData.stoppages) {
                const found = latestData.stoppages.find((s:any) => s.name?.trim().toLowerCase() === name.trim().toLowerCase());
                if (found && found.coords) return found.coords;
            }
            return null;
        };

        // 2. Process Start Stand
        let finalStartCoords = findPreservedCoords(startStand, 'start');
        if (!finalStartCoords) {
            setStatusMsg('Fetching Start Coords...');
            finalStartCoords = await getCoordinates(startStand);
        }

        // 3. Process End Stand
        let finalEndCoords = findPreservedCoords(endStand, 'end');
        if (!finalEndCoords) {
            setStatusMsg('Fetching End Coords...');
            finalEndCoords = await getCoordinates(endStand);
        }

        // 4. Process Stoppages
        const processedStops = [];
        const stopsToProcess = stoppages.filter(s => s.name && s.time);
        
        for (let i = 0; i < stopsToProcess.length; i++) {
            const stop = stopsToProcess[i];
            
            // Try to find preserved coords from DB
            let stopCoords = findPreservedCoords(stop.name, 'stop');
            
            // Only fetch from internet if NOT in DB
            if (!stopCoords) {
                setStatusMsg(`Fetching ${stop.name}...`);
                stopCoords = await getCoordinates(stop.name);
            }

            processedStops.push({ ...stop, coords: stopCoords });
        }

        const fullRoute = [
            { name: startStand, time: startTime, isStart: true, coords: finalStartCoords },
            ...processedStops,
            { name: endStand, time: endTime, isEnd: true, coords: finalEndCoords }
        ];
        
        const busData = {
            driverId: user.uid, busName, busNo,
            startStand, startStandShort: startStand.substring(0,3).toUpperCase(), startTime, startCoords: finalStartCoords,
            endStand, endStandShort: endStand.substring(0,3).toUpperCase(), endTime, endCoords: finalEndCoords,
            mainPrice, 
            returnStartTime, returnEndTime, 
            returnPrice,
            runDays: selectedDays, stoppages: fullRoute, updatedAt: new Date().toISOString(),
            searchKeywords: [startStand, endStand, ...stoppages.map(s=>s.name)].map(s=>s.toLowerCase())
        };
        
        setStatusMsg('Saving...');
        
        // 🛡️ MERGE: Use merge true to be safe, though we are replacing most fields
        await setDoc(docRef, busData, { merge: true });
        
        if(Platform.OS === 'web') alert('Saved! Manual Coords Preserved.'); else Alert.alert('Success', 'Bus Saved! Your manual coordinates are safe.');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setSaving(false); setStatusMsg('Save Bus'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary}/></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
    <View style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.subHeader}>Welcome to bus stand</Text><Text style={styles.mainHeader}>Your Route, Your Way</Text></View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}><Ionicons name="log-out-outline" size={24} color={COLORS.error} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.routeVisual}>
           <Ionicons name="bus" size={24} color={COLORS.primary} /><View style={styles.dashedLine} /><Ionicons name="location" size={24} color={COLORS.primary} />
        </View>

        <View style={styles.section}>
            <View style={styles.inputGroup}><Text style={styles.label}>BUS NAME</Text><TextInput style={styles.inputBox} value={busName} onChangeText={setBusName} placeholder="e.g. Patna Express" placeholderTextColor="#999" /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>BUS NUMBER</Text><TextInput style={styles.inputBox} value={busNo} onChangeText={setBusNo} placeholder="e.g. BR-01-AB-1234" placeholderTextColor="#999" /></View>
        </View>

        {/* 🟢 MAIN TRIP */}
        <Text style={styles.sectionTitle}>Main Trip (Going)</Text>
        <View style={styles.section}>
            <View style={styles.row}>
                <View style={{flex:1, marginRight:8}}>
                    <Text style={styles.label}>START STAND</Text>
                    <TextInput style={styles.inputBox} value={startStand} onChangeText={setStartStand} placeholder="Start" placeholderTextColor="#999" />
                    <TouchableOpacity style={styles.timeBox} onPress={() => openPicker('start')}><Text style={styles.timeText}>{startTime || "Select Time"}</Text></TouchableOpacity>
                </View>
                <View style={{flex:1, marginLeft:8}}>
                    <Text style={styles.label}>END STAND</Text>
                    <TextInput style={styles.inputBox} value={endStand} onChangeText={setEndStand} placeholder="End" placeholderTextColor="#999" />
                    <TouchableOpacity style={styles.timeBox} onPress={() => openPicker('end')}><Text style={styles.timeText}>{endTime || "Select Time"}</Text></TouchableOpacity>
                    <View style={{marginTop: 10}}><Text style={styles.label}>TICKET PRICE (End)</Text><TextInput style={[styles.inputBox, {borderColor: COLORS.primary}]} value={mainPrice} onChangeText={setMainPrice} placeholder="₹ Price" placeholderTextColor="#999" keyboardType="numeric" /></View>
                </View>
            </View>
        </View>

        <Text style={styles.label}>SELECT RUNNING DAYS</Text>
        <View style={styles.daysRow}>
            {daysLabel.map((d, i) => (
                <TouchableOpacity key={i} onPress={() => toggleDay(i)} style={[styles.dayBox, selectedDays[i] && styles.activeDay]}>
                    <Text style={{color: selectedDays[i]?'#FFF':'#333', fontWeight:'bold', fontSize: 14}}>{d}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* 🛑 STOPPAGES */}
        <Text style={styles.label}>INTERMEDIATE STOPS (GOING)</Text>
        {stoppages.map((s, i) => (
            <View key={i} style={styles.stopCard}>
                <Text style={styles.subLabel}>Stop Name</Text>
                <TextInput style={styles.inputBox} placeholder="Enter Stop Name" placeholderTextColor="#999" value={s.name} onChangeText={t=>updateStoppage(i,'name',t)} />
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                    <View style={{flex: 1}}>
                         <Text style={styles.subLabel}>Arrival Time (Going)</Text>
                         <TouchableOpacity style={styles.timeBox} onPress={() => openPicker(i)}><Text style={{color: COLORS.primary, fontWeight: 'bold'}}>{s.time || "Select"}</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        ))}
        <TouchableOpacity onPress={addStoppage} style={styles.addBtn}><Text style={styles.addBtnText}>+ ADD MORE STOPPAGE</Text></TouchableOpacity>

        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginVertical: 30, opacity: 0.5}}>
            <View style={{height:1, backgroundColor:'#000', flex:1}}/><Ionicons name="swap-vertical" size={20} color="#000" /><View style={{height:1, backgroundColor:'#000', flex:1}}/>
        </View>

        {/* 🔴 RETURN TRIP */}
        <Text style={styles.sectionTitle}>Return Trip (Coming Back)</Text>
        <View style={styles.section}>
            <View style={styles.row}>
                <View style={{flex:1, marginRight:8}}>
                    <Text style={styles.label}>START ({endStand || '...'})</Text>
                    <TouchableOpacity style={styles.timeBox} onPress={() => openPicker('retStart')}><Text style={styles.timeText}>{returnStartTime || "Select Time"}</Text></TouchableOpacity>
                </View>
                <View style={{flex:1, marginLeft:8}}>
                    <Text style={styles.label}>END ({startStand || '...'})</Text>
                    <TouchableOpacity style={styles.timeBox} onPress={() => openPicker('retEnd')}><Text style={styles.timeText}>{returnEndTime || "Select Time"}</Text></TouchableOpacity>
                    <View style={{marginTop: 10}}><Text style={styles.label}>TICKET PRICE (End)</Text><TextInput style={[styles.inputBox, {borderColor: COLORS.primary}]} value={returnPrice} onChangeText={setReturnPrice} placeholder="₹ Price" placeholderTextColor="#999" keyboardType="numeric" /></View>
                </View>
            </View>
        </View>

        {/* 🔄 AUTOMATIC RETURN ROUTE WITH TIME SELECT */}
        {stoppages.length > 0 && stoppages.some(s => s.name) && (
            <View style={{marginTop: 10}}>
                <Text style={styles.label}>INTERMEDIATE STOPS (RETURN)</Text>
                {stoppages.slice().reverse().map((stop, index) => {
                    const originalIndex = stoppages.length - 1 - index;
                    if(!stop.name) return null;
                    return (
                        <View key={originalIndex} style={styles.stopCard}>
                            <View style={{flexDirection:'row', alignItems:'center', marginBottom: 10}}>
                                <Ionicons name="arrow-down" size={16} color={COLORS.gray} style={{marginRight:5}}/>
                                <Text style={[styles.subLabel, {fontSize: 16, color: COLORS.primary, fontWeight:'bold'}]}>{stop.name}</Text>
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.subLabel}>Arrival Time (Return)</Text>
                                <TouchableOpacity style={styles.timeBox} onPress={() => openPicker(`ret_${originalIndex}`)}>
                                    <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>{stop.returnTime || "Select Time"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{statusMsg}</Text>}
        </TouchableOpacity>
      </ScrollView>
      <CustomTimePicker visible={showPicker} onClose={() => setShowPicker(false)} onSelect={handleTimeSelect} />
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  subHeader: { color: COLORS.gray, fontSize: 12 },
  mainHeader: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  logoutBtn: { padding: 10, backgroundColor: '#FFF0F0', borderRadius: 10 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  routeVisual: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 25, opacity: 0.8 },
  dashedLine: { height: 1, backgroundColor: COLORS.primary, flex: 1, marginHorizontal: 10, borderStyle: 'dashed', borderRadius: 1 },
  section: { marginBottom: 10 },
  inputGroup: { marginBottom: 15 },
  row: { flexDirection: 'row' },
  inputBox: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0', color: COLORS.primary, fontWeight: '500' },
  timeBox: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, borderWidth: 1, borderColor: '#E0E0E0', marginTop: 0, alignItems: 'center' },
  label: { fontSize: 11, color: COLORS.gray, marginBottom: 6, fontWeight:'700', textTransform: 'uppercase', letterSpacing: 0.5 },
  subLabel: { fontSize: 10, color: COLORS.gray, marginBottom: 4, fontWeight:'500' },
  timeText: { fontWeight: 'bold', color: COLORS.primary, fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: COLORS.primary, marginTop: 10 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  dayBox: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  activeDay: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stopCard: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  addBtn: { backgroundColor: '#F0F0F0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, alignSelf: 'flex-start', marginTop: 5, marginBottom: 25 },
  addBtnText: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 0.5 },
  saveButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 50, shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 5 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerContainer: { width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 5 },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pickerColumn: { flex: 1, alignItems: 'center' },
  colHeader: { fontWeight: 'bold', marginBottom: 10, color: 'gray' },
  pickerItem: { padding: 10, width: '100%', alignItems: 'center' },
  pickerItemSelected: { backgroundColor: '#F0F0F0', borderRadius: 5 }, 
  pickerText: { fontSize: 16 },
  pickerTextSelected: { fontWeight: 'bold', color: COLORS.primary },
  confirmBtn: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  confirmText: { color: '#FFF', fontWeight: 'bold' },
  cancelBtn: { padding: 10, alignItems: 'center' },
  cancelText: { color: 'red' }
});

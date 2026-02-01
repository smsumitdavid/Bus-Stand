import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, StatusBar, Keyboard, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../src/services/firebaseConfig';
import { COLORS } from '../../src/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation(); 
  
  const [fromStand, setFromStand] = useState('');
  const [toStand, setToStand] = useState('');
  const [busNameQuery, setBusNameQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [allStands, setAllStands] = useState<{name: string, code: string}[]>([]);
  const [suggestions, setSuggestions] = useState<{name: string, code: string}[]>([]);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // ⌨️ Keyboard State
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => { 
      loadHistory(); 
      fetchAllStands(); 
  }, []);

  // 🛠️ EFFECT: Tab Bar Styling & Hiding Logic
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { 
        display: isKeyboardVisible ? 'none' : 'flex',
        height: 70,          // Height badhi hui hai
        paddingTop: 15,      // Gap maintain kiya hai
        paddingBottom: 10,   
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5      
      }
    });
  }, [isKeyboardVisible, navigation]);

  const loadHistory = async () => { try { const history = await AsyncStorage.getItem('searchHistory'); if (history) setRecentSearches(JSON.parse(history)); } catch (e) { console.log(e); } };
  
  const fetchAllStands = async () => { 
    try { 
        const q = await getDocs(collection(db, 'buses')); 
        const m = new Map(); 
        q.forEach(d => { 
            const dt = d.data(); 
            if(dt.startStand) m.set(dt.startStand.trim(), dt.startStandShort); 
            if(dt.endStand) m.set(dt.endStand.trim(), dt.endStandShort); 
            if(dt.stoppages) dt.stoppages.forEach((s: any) => { if(s.name) m.set(s.name.trim(), s.name.substring(0,3).toUpperCase()); }); 
        }); 
        setAllStands(Array.from(m, ([name, code]) => ({ name, code }))); 
    } catch (e) { console.log(e); } 
  };

  const handleInputChange = (text: string, field: 'from' | 'to') => { 
    if (field === 'from') setFromStand(text); else setToStand(text); 
    if (text.length > 0) { 
        const f = allStands.filter(s => s.name.toLowerCase().startsWith(text.toLowerCase())).slice(0, 5); 
        setSuggestions(f); setActiveField(field); 
    } else { setSuggestions([]); setActiveField(null); } 
  };

  const selectSuggestion = (item: {name: string, code: string}) => { 
    if (activeField === 'from') setFromStand(item.name); else setToStand(item.name); 
    setSuggestions([]); setActiveField(null); 
    Keyboard.dismiss();
    setKeyboardVisible(false); 
  };

  // ⏱️ TIME HELPERS
  const parseMinutes = (timeStr: string) => { 
    if (!timeStr || timeStr === "N/A" || timeStr === "--") return -1; 
    const [t, mod] = timeStr.split(' '); 
    if(!t || !mod) return -1;
    let [h, m] = t.split(':').map(Number); 
    if (isNaN(h) || isNaN(m)) return -1;
    if (h === 12 && mod === 'AM') h = 0; 
    if (h !== 12 && mod === 'PM') h += 12; 
    return h * 60 + m; 
  };
  
  const getDurationString = (startStr: string, endStr: string) => { 
    if(!startStr || !endStr || startStr === "N/A" || endStr === "N/A") return "--";
    let min1 = parseMinutes(startStr); 
    let min2 = parseMinutes(endStr);
    if(min1 === -1 || min2 === -1) return "--";

    let diff = min2 - min1; 
    if (diff < 0) diff += 24 * 60; 
    const h = Math.floor(diff / 60); 
    const m = diff % 60; 
    return `${h}hr ${m}m`; 
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    setKeyboardVisible(false); 
    if (!fromStand || !toStand) { Alert.alert("Missing Info", "Enter From and To stations."); return; }
    setIsSearching(true); setSuggestions([]);

    try {
      const querySnapshot = await getDocs(collection(db, 'buses'));
      let foundBus: any = null;
      let dStart = '', dEnd = '', dTime = '';
      const searchFrom = fromStand.toLowerCase().trim();
      const searchTo = toStand.toLowerCase().trim();

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        const stops = data.stoppages || []; 

        const fromIndex = stops.findIndex((s: any) => s.name?.toLowerCase().trim() === searchFrom);
        const toIndex = stops.findIndex((s: any) => s.name?.toLowerCase().trim() === searchTo);

        const isMainEndStart = data.endStand?.toLowerCase().trim() === searchFrom;
        const isMainStartEnd = data.startStand?.toLowerCase().trim() === searchTo;

        let finalFromIndex = fromIndex;
        let finalToIndex = toIndex;

        if (data.startStand?.toLowerCase().trim() === searchFrom) finalFromIndex = 0; 
        if (isMainEndStart) finalFromIndex = stops.length - 1; 
        if (data.endStand?.toLowerCase().trim() === searchTo) finalToIndex = stops.length - 1; 
        if (isMainStartEnd) finalToIndex = 0; 

        if (finalFromIndex !== -1 && finalToIndex !== -1) {
            if (finalFromIndex < finalToIndex) {
                foundBus = { ...data };
                const sNode = stops[finalFromIndex];
                const eNode = stops[finalToIndex];
                dStart = sNode ? sNode.time : data.startTime;
                dEnd = eNode ? eNode.time : data.endTime;
                dTime = getDurationString(dStart, dEnd);
                break;
            } 
            else if (finalFromIndex > finalToIndex && data.returnStartTime) {
                foundBus = { ...data };
                if (finalFromIndex === stops.length - 1) {
                    dStart = data.returnStartTime;
                } else {
                    const node = stops[finalFromIndex];
                    dStart = node ? (node.returnTime || "N/A") : "N/A";
                }
                if (finalToIndex === 0) {
                    dEnd = data.returnEndTime;
                } else {
                    const node = stops[finalToIndex];
                    dEnd = node ? (node.returnTime || "N/A") : "N/A";
                }
                dTime = getDurationString(dStart, dEnd);
                break;
            }
        }
      }

      if (foundBus) {
        const shortFrom = fromStand.substring(0,3).toUpperCase();
        const shortTo = toStand.substring(0,3).toUpperCase();
        const newSearch = { 
          id: Date.now(), from: fromStand, to: toStand, 
          shortFrom, shortTo, startTime: dStart, endTime: dEnd, 
          duration: dTime, busName: foundBus.busName 
        };
        const updatedHistory = [newSearch, ...recentSearches.filter(i => i.from !== fromStand || i.to !== toStand)].slice(0, 5);
        setRecentSearches(updatedHistory);
        await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        router.push({ pathname: '/bus/listing', params: { from: fromStand, to: toStand } });
      } else {
        router.push({ pathname: '/bus/listing', params: { from: fromStand, to: toStand } });
      }
    } catch (error) { console.log(error); } finally { setIsSearching(false); }
  };

  const handleBusNameSearch = () => { 
    if (!busNameQuery) return; 
    Keyboard.dismiss();
    setKeyboardVisible(false);
    router.push({ pathname: '/bus/listing', params: { busName: busNameQuery } }); 
  };
  
  const clearHistory = async () => { await AsyncStorage.removeItem('searchHistory'); setRecentSearches([]); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}><View><Text style={styles.welcomeText}>Welcome to bus stand</Text><Text style={styles.titleText}>Where are you going next?</Text></View></View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <View style={[styles.section, { zIndex: 10 }]}> 
            <View style={styles.inputGroup}><Ionicons name="bus-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput 
                    style={styles.inputBox} 
                    placeholder="From Stand" 
                    placeholderTextColor="#999" 
                    value={fromStand} 
                    onChangeText={(t) => handleInputChange(t, 'from')} 
                    onFocus={() => { 
                        setKeyboardVisible(true);
                        if(fromStand) handleInputChange(fromStand, 'from'); 
                    }}
                    onBlur={() => setKeyboardVisible(false)}
                />
            </View>
            <View style={styles.connectorLine}><View style={styles.dots} /><Ionicons name="swap-vertical" size={16} color={COLORS.gray} /><View style={styles.dots} /></View>
            <View style={styles.inputGroup}><Ionicons name="location-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput 
                    style={styles.inputBox} 
                    placeholder="To Stand" 
                    placeholderTextColor="#999" 
                    value={toStand} 
                    onChangeText={(t) => handleInputChange(t, 'to')} 
                    onFocus={() => { 
                        setKeyboardVisible(true);
                        if(toStand) handleInputChange(toStand, 'to'); 
                    }}
                    onBlur={() => setKeyboardVisible(false)}
                />
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isSearching}>{isSearching ? <ActivityIndicator color="#FFF"/> : <Text style={styles.searchButtonText}>Search Bus</Text>}</TouchableOpacity>
            
            {suggestions.length > 0 && activeField && (<View style={[styles.suggestionBox, activeField === 'to' ? {top: 130} : {top: 55}]}>{suggestions.map((item, index) => (<TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}><Text style={styles.suggestionName}>{item.name}</Text><View style={styles.codePill}><Text style={styles.codeText}>{item.code}</Text></View></TouchableOpacity>))}</View>)}
        </View>

        <View style={styles.busNameSection}><View style={styles.busInputContainer}><Ionicons name="search-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput 
                style={[styles.inputBox, {borderWidth: 0}]} 
                placeholder="Bus No. / Bus Name" 
                placeholderTextColor="#999" 
                value={busNameQuery} 
                onChangeText={setBusNameQuery}
                onFocus={() => setKeyboardVisible(true)}
                onBlur={() => setKeyboardVisible(false)}
            />
        </View><TouchableOpacity style={styles.squareSearchBtn} onPress={handleBusNameSearch}><Ionicons name="search" size={24} color="#FFF" /></TouchableOpacity></View>
        
        <View style={styles.historyHeader}><Text style={styles.historyTitle}>Search History</Text>{recentSearches.length > 0 && (<TouchableOpacity onPress={clearHistory}><Text style={{color: COLORS.gray, fontSize: 12}}>Clear</Text></TouchableOpacity>)}</View>
        {recentSearches.length === 0 ? (<Text style={styles.emptyHistory}>No recent searches</Text>) : (recentSearches.map((item, index) => (<TouchableOpacity key={index} style={styles.historyCard} onPress={() => { setFromStand(item.from); setToStand(item.to); handleSearch(); }}><Text style={styles.historyBusName}>{item.busName}</Text><View style={styles.historyRow}><View style={{flex: 1, alignItems: 'flex-start'}}><Text style={styles.standLabel} numberOfLines={1}>{item.from}</Text><Text style={styles.shortCode}>{item.shortFrom}</Text><Text style={styles.timeText}>{item.startTime}</Text></View><View style={styles.centerGraphic}><View style={styles.lineGraphic}><View style={styles.dot} /><View style={styles.dashedLine} /><View style={styles.dot} /></View><Text style={styles.durationText}>{item.duration}</Text></View><View style={{flex: 1, alignItems: 'flex-end'}}><Text style={styles.standLabel} numberOfLines={1}>{item.to}</Text><Text style={styles.shortCode}>{item.shortTo}</Text><Text style={styles.timeText}>{item.endTime}</Text></View></View></TouchableOpacity>)))}
        <View style={{height: 80}} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: COLORS.gray, fontSize: 12 },
  titleText: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginTop: 5 },
  scrollContent: { paddingHorizontal: 20 },
  section: { marginBottom: 20, position: 'relative' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 15, height: 55, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  inputBox: { flex: 1, fontSize: 16, color: COLORS.primary, fontWeight: '500', height: '100%', paddingLeft: 10 },
  inputIcon: { marginRight: 5 },
  connectorLine: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 40 },
  dots: { width: 2, height: 15, backgroundColor: '#E0E0E0', marginHorizontal: 5 },
  suggestionBox: { position: 'absolute', left: 0, right: 0, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#DDD', zIndex: 100, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, paddingVertical: 5, maxHeight: 250 },
  suggestionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  codePill: { backgroundColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  codeText: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  searchButton: { backgroundColor: COLORS.primary, borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  searchButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  busNameSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 10 },
  busInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 15, height: 55 },
  squareSearchBtn: { width: 55, height: 55, backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray },
  emptyHistory: { color: COLORS.gray, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  historyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05 },
  historyBusName: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 10 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  standLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 4, textTransform: 'capitalize' },
  shortCode: { fontSize: 24, fontWeight: '900', color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase' },
  timeText: { fontSize: 14, fontWeight: '600', color: COLORS.gray, marginTop: 4 },
  centerGraphic: { flex: 1, alignItems: 'center', marginHorizontal: 10 },
  lineGraphic: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gray },
  dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#DDD', borderStyle: 'dashed', borderRadius: 1, marginHorizontal: 2 },
  durationText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary }
});

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Animated, Easing, Image, Switch, Alert, Share, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../src/services/firebaseConfig';
import { COLORS } from '../../src/constants/theme';
import * as Location from 'expo-location';

// 📸 Screenshot & Sharing Imports
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from 'expo-sharing';

// 🌍 MATH: Calculate Distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if(!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};
const deg2rad = (deg: number) => deg * (Math.PI/180);

export default function BusDetailScreen() {
  const { id, fromStand, toStand, isReturnTrip } = useLocalSearchParams();
  const router = useRouter();
  
  const [bus, setBus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 🟢 Tracking State
  const [isInsideBus, setIsInsideBus] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  
  // 🚫 Error Popup State
  const [showError, setShowError] = useState(false);

  // 🚌 Animation Logic
  const busAnim = useRef(new Animated.Value(0)).current;
  const [lineHeight, setLineHeight] = useState(0);
  const [stopsList, setStopsList] = useState<any[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0); 
  
  // 📸 ViewShot Reference (For Screenshot)
  const viewShotRef = useRef(null);

  // 📡 Real-time Database
  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'buses', id as string);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBus(data);
        prepareStops(data);
        setLoading(false);
      }
    });
    return () => {
        unsubscribe();
        stopTrackingSafe();
    };
  }, [id]);

  const stopTrackingSafe = () => {
      try {
          if (locationSubscription) locationSubscription.remove();
      } catch (e) { console.log("Stop tracking error", e); }
      setLocationSubscription(null);
  };

  // 🔄 Process Stops
  const prepareStops = (data: any) => {
      let displayStops: any[] = [];
      const rawStops = data.stoppages || [];
      const totalDist = parseFloat(data.totalDistance) || 0;

      const intermediate = rawStops.filter((s:any) => 
        s.name.toLowerCase().trim() !== data.startStand.toLowerCase().trim() &&
        s.name.toLowerCase().trim() !== data.endStand.toLowerCase().trim()
      );

      const isReturn = isReturnTrip === 'true';

      if (isReturn) {
        // Return Trip
        displayStops.push({ name: data.endStand, time: data.returnStartTime, coords: data.endCoords, isMain: true, distDisplay: '0 km' });
        for (let i = intermediate.length - 1; i >= 0; i--) {
            const stopDist = parseFloat(intermediate[i].distance) || 0;
            const returnDist = totalDist - stopDist;
            displayStops.push({ name: intermediate[i].name, time: intermediate[i].returnTime, coords: intermediate[i].coords, isMain: false, distDisplay: `${returnDist.toFixed(1)} km` });
        }
        displayStops.push({ name: data.startStand, time: data.returnEndTime, coords: data.startCoords, isMain: true, distDisplay: `${totalDist} km` });
      } else {
        // Main Trip
        displayStops.push({ name: data.startStand, time: data.startTime, coords: data.startCoords, isMain: true, distDisplay: '0 km' });
        intermediate.forEach((stop: any) => {
            const d = stop.distance || 0;
            displayStops.push({ name: stop.name, time: stop.time, coords: stop.coords, isMain: false, distDisplay: `${d} km` });
        });
        displayStops.push({ name: data.endStand, time: data.endTime, coords: data.endCoords, isMain: true, distDisplay: `${totalDist} km` });
      }
      setStopsList(displayStops);
  };

  // 🎬 Animation Engine
  useEffect(() => {
      if (!bus || lineHeight === 0 || stopsList.length === 0) return;
      const now = Date.now();
      const lastUpdate = bus.lastLocationUpdate || 0;
      const isLive = (now - lastUpdate) < 10 * 60 * 1000 && bus.currentCoords;

      let progress = 0;
      if (isLive) {
          progress = calculateGPSProgress(bus.currentCoords);
      } else {
          progress = calculateTimeProgress();
      }
      setCurrentProgress(progress);
      animateTo(progress);
  }, [bus, lineHeight, stopsList]);

  const calculateGPSProgress = (currentCoords: {lat: number, lng: number}) => {
      if (!stopsList[0]?.coords || !stopsList[stopsList.length-1]?.coords) return 0;
      let totalDist = 0;
      for(let i=0; i<stopsList.length-1; i++) {
          if(stopsList[i].coords && stopsList[i+1].coords) {
              totalDist += getDistance(stopsList[i].coords.lat, stopsList[i].coords.lng, stopsList[i+1].coords.lat, stopsList[i+1].coords.lng);
          }
      }
      let coveredDist = getDistance(stopsList[0].coords.lat, stopsList[0].coords.lng, currentCoords.lat, currentCoords.lng);
      if (totalDist === 0) return 0;
      return Math.min(Math.max(coveredDist / totalDist, 0), 1);
  };

  const parseMinutes = (timeStr: string) => { 
    if (!timeStr || timeStr === "N/A") return 0;
    const [t, mod] = timeStr.split(' '); 
    if(!t) return 0;
    let [h, m] = t.split(':').map(Number); 
    if (h === 12 && mod === 'AM') h = 0; 
    if (h !== 12 && mod === 'PM') h += 12; 
    return h * 60 + m; 
  };

  const calculateTimeProgress = () => {
      if(stopsList.length < 2) return 0;
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const startMins = parseMinutes(stopsList[0].time);
      const endMins = parseMinutes(stopsList[stopsList.length-1].time);
      let totalDuration = endMins - startMins;
      if (totalDuration < 0) totalDuration += 24 * 60; 
      if (currentMins < startMins) return 0;
      if (currentMins > endMins) return 1;
      return (currentMins - startMins) / totalDuration;
  };

  const animateTo = (progress: number) => {
      const pixelValue = progress * (lineHeight - 60); 
      Animated.timing(busAnim, {
          toValue: pixelValue,
          duration: 2000, 
          easing: Easing.linear,
          useNativeDriver: true
      }).start();
  };

  // 📍 SECURE TRACKING LOGIC
  const toggleTracking = async (value: boolean) => {
    if (!value) {
        setIsInsideBus(false);
        stopTrackingSafe(); 
        updateDoc(doc(db, 'buses', id as string), { isLive: false });
        return;
    }
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { Alert.alert("Permission Denied", "GPS needed."); return; }
        const userLoc = await Location.getCurrentPositionAsync({});
        const uLat = userLoc.coords.latitude;
        const uLng = userLoc.coords.longitude;

        let isNearBus = false;
        for (let stop of stopsList) {
            if (stop.coords && stop.coords.lat) {
                const dist = getDistance(uLat, uLng, stop.coords.lat, stop.coords.lng);
                if (dist <= 0.05) { isNearBus = true; break; }
            }
        }
        if (!isNearBus) { setIsInsideBus(false); triggerErrorPopup(); return; }

        setIsInsideBus(true);
        const sub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            (loc) => {
                updateDoc(doc(db, 'buses', id as string), {
                    currentCoords: { lat: loc.coords.latitude, lng: loc.coords.longitude },
                    lastLocationUpdate: Date.now(),
                    isLive: true
                });
            }
        );
        setLocationSubscription(sub);
        Alert.alert("Verified!", "You are inside the bus range. Tracking started. 🚀");
    } catch (error) { console.log(error); Alert.alert("Error", "Could not verify location."); }
  };

  const triggerErrorPopup = () => {
      setShowError(true);
      setTimeout(() => { setShowError(false); }, 10000);
  };

  // 🔴 Delay Logic
  const getDelayText = (stopTime: string, index: number) => {
      if(!stopTime || stopTime === "N/A") return null;
      const stopProgress = index / (stopsList.length - 1);
      if (currentProgress > stopProgress + 0.05) return null;
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const stopMins = parseMinutes(stopTime);
      const diff = currentMins - stopMins;
      if (diff > 15 && diff < 180) return `Late by ${diff} min`;
      return null;
  };

  // 📤 SHARE FUNCTIONALITY
  const handleShare = async () => {
    try {
        // 1. Capture Screenshot
        const uri = await captureRef(viewShotRef, {
            format: 'jpg',
            quality: 0.8,
        });

        // 2. Create Message
        const busName = bus?.busName || "Bus";
        const message = `Check out the running status of ${fromStand} - ${toStand} (${busName}) 🚌\n\nLink: busapp://bus/${id}\n\nDownload App: enter your app link🌼`;

        // 3. Share Screenshot + Text
        if (Platform.OS === 'android') {
             // Android often prefers Sharing.shareAsync for files with intent
             await Sharing.shareAsync(uri, {
                mimeType: 'image/jpeg',
                dialogTitle: `Share Status of ${busName}`,
                // Note: Some Android apps ignore text when sharing a file, but this is the best Expo method
            });
            // Fallback copy to clipboard if needed, but share sheet is primary
        } else {
            // iOS supports sharing both content
             await Share.share({
                url: uri,
                message: message,
            });
        }
    } catch (error) {
        console.error("Sharing failed", error);
        Alert.alert("Error", "Could not share screenshot.");
    }
  };

  if (loading) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      
      {/* 🛑 Security Popup */}
      {showError && (
          <View style={styles.errorBanner}>
              <Ionicons name="warning" size={20} color="#FFF" style={{marginRight: 8}} />
              <Text style={styles.errorText}>Sorry! Looks like you are not inside the bus.</Text>
          </View>
      )}

      {/* 🟢 Header with SHARE BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
            <Text style={styles.routeTitle}>{fromStand} — {toStand}</Text>
            <Text style={styles.dateSub}>Trip Details</Text>
        </View>

        {/* ✨ SHARE BUTTON (Pill Shape) */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share</Text>
            <Ionicons name="navigate-outline" size={14} color="#333" style={{transform: [{ rotate: '45deg' }]}} />
        </TouchableOpacity>
      </View>

      {/* 📸 WRAP SCROLLVIEW IN VIEWSHOT to Capture it */}
      <ViewShot ref={viewShotRef} style={{flex: 1, backgroundColor: '#FFF'}} options={{ format: "jpg", quality: 0.9 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tracking Card */}
        <View style={styles.trackingCard}>
            <View style={styles.trackingRow}>
                <Text style={styles.trackingTitle}>Inside this bus?</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Switch value={isInsideBus} onValueChange={toggleTracking} trackColor={{ false: '#767577', true: '#00C853' }} thumbColor={'#FFFFFF'} ios_backgroundColor="#767577" />
                    <Text style={styles.toggleText}>{isInsideBus ? "Yes" : "No"}</Text>
                </View>
            </View>
            {isInsideBus && (<View><View style={styles.divider} /><View style={styles.gpsRow}><Text style={styles.gpsLabel}>Track location with</Text><View style={styles.gpsBadge}><Text style={styles.gpsText}>GPS</Text></View></View></View>)}
        </View>

        {/* 🛣️ TIMELINE SECTION */}
        <View style={styles.timelineContainer}>
          <View style={styles.roadContainer} onLayout={(event) => setLineHeight(event.nativeEvent.layout.height)}>
             <View style={styles.roadBackground} />
             <View style={styles.roadDashes} />
          </View>

          {/* Stops */}
          <View style={styles.stopsLayer}>
            {stopsList.map((stop: any, index: number) => {
                const delay = getDelayText(stop.time, index);
                return (
                <View key={index} style={styles.stopRow}>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeText}>{stop.time}</Text>
                        {delay && <Text style={styles.delayText}>{delay}</Text>}
                    </View>
                    <View style={styles.nodeContainer}>
                        <View style={[styles.stopDot, { 
                            backgroundColor: stop.isMain ? COLORS.primary : '#FFF',
                            borderColor: stop.isMain ? '#FFF' : '#AAA',
                            borderWidth: 2,
                            transform: [{ scale: stop.isMain ? 1.3 : 1 }]
                        }]} />
                    </View>
                    <View style={styles.stopInfoBox}>
                        <Text style={[styles.stopName, stop.isMain && {fontSize: 18, fontWeight:'900'}]}>{stop.name}</Text>
                        <Text style={styles.distanceText}>{stop.distDisplay}</Text>
                    </View>
                </View>
            )})}
          </View>

          {/* 🚌 Moving Bus */}
          <Animated.View style={[styles.movingBusContainer, { transform: [{ translateY: busAnim }] }]}>
            {(bus?.isLive && (Date.now() - (bus.lastLocationUpdate||0) < 600000)) && 
                <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>
            }
            <Image source={require('../../assets/images/favicon.png')} style={styles.busImage} />
          </Animated.View>

        </View>

        <View style={styles.bannerAd}><Text style={{fontWeight: 'bold', color: COLORS.primary}}>Banner Ads</Text></View>
      </ScrollView>
      </ViewShot> 
      {/* End ViewShot */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 100, backgroundColor: '#D32F2F', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  errorText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  
  // Header with Share Button
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', elevation: 3, justifyContent: 'space-between' },
  backBtn: { padding: 5 },
  headerTextContainer: { marginLeft: 15, flex: 1 },
  routeTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  dateSub: { fontSize: 12, color: COLORS.gray },
  
  // ✨ Share Button Style
  shareBtn: { backgroundColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  shareBtnText: { fontSize: 12, fontWeight: '600', color: '#333', marginRight: 4 },

  scrollContent: { padding: 20, paddingBottom: 40, backgroundColor: '#FFF' }, // Added bg white for screenshot
  trackingCard: { backgroundColor: '#FAFAFA', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 20, marginTop: 10, marginBottom: 25, marginHorizontal: 10, borderWidth: 1, borderColor: '#E0E0E0', elevation: 2 },
  trackingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackingTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  toggleText: { fontSize: 14, fontWeight: '600', marginLeft: 8, color: '#333' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 12 },
  gpsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gpsLabel: { fontSize: 14, fontWeight: '500', color: '#333' },
  gpsBadge: { backgroundColor: '#222', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 20 },
  gpsText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  timelineContainer: { position: 'relative', paddingLeft: 10 },
  roadContainer: { position: 'absolute', left: 97, top: 25, bottom: 40, width: 16, alignItems: 'center', zIndex: 0 },
  roadBackground: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#BDBDBD', borderRadius: 8 },
  roadDashes: { position: 'absolute', top: 0, bottom: 0, width: 2, borderStyle: 'dashed', borderWidth: 1, borderColor: '#FFF', borderRadius: 1 },
  stopsLayer: { zIndex: 1 },
  stopRow: { flexDirection: 'row', marginBottom: 40, minHeight: 50, alignItems: 'center' },
  timeBox: { width: 80, alignItems: 'flex-end', paddingRight: 20 },
  timeText: { fontWeight: 'bold', fontSize: 13, color: '#333' },
  delayText: { fontSize: 10, color: 'red', fontWeight: 'bold', marginTop: 2 },
  nodeContainer: { width: 30, alignItems: 'center', justifyContent: 'center' },
  stopDot: { width: 14, height: 14, borderRadius: 7, elevation: 2, zIndex: 1 },
  stopInfoBox: { flex: 1, paddingLeft: 15, justifyContent: 'center' },
  stopName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  distanceText: { fontSize: 12, color: '#777', marginTop: 2, fontWeight: '500' },
  movingBusContainer: { position: 'absolute', left: 88, top: 25, zIndex: 10, elevation: 10, alignItems: 'center' },
  busImage: { width: 34, height: 34, resizeMode: 'contain' },
  liveBadge: { position:'absolute', top: -14, alignSelf: 'center', backgroundColor: '#FF0000', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, zIndex: 20, elevation: 5 },
  liveText: { color: 'white', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  bannerAd: { height: 60, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 20 }
});

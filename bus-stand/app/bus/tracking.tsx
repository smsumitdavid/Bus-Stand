import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

// Note: For production, install react-native-maps
// npx expo install react-native-maps

export default function TrackingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
         <Text style={{color: COLORS.gray}}>Map View Loading...</Text>
         <Text style={{fontSize: 10, color: '#999'}}>(Integration requires API Key)</Text>
         
         {/* Simulated Bus Icon on Map */}
         <View style={styles.busMarker}>
            <Ionicons name="bus" size={20} color="white" />
         </View>
      </View>

      {/* Bottom Sheet Info */}
      <View style={styles.bottomSheet}>
         <View style={styles.dragHandle} />
         <Text style={styles.busTitle}>Patna Express (BR-01-AB-1234)</Text>
         <Text style={styles.status}>On Time • 45km/h</Text>
         
         <View style={styles.row}>
            <View style={styles.stat}>
               <Text style={styles.label}>Next Stop</Text>
               <Text style={styles.val}>Sonpur</Text>
            </View>
            <View style={styles.stat}>
               <Text style={styles.label}>Est. Time</Text>
               <Text style={styles.val}>10:30 AM</Text>
            </View>
         </View>

         <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Close Map</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEE' },
  mapContainer: { 
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1E1E1' 
  },
  busMarker: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 10
  },
  bottomSheet: {
    backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    position: 'absolute', bottom: 0, width: '100%', elevation: 10
  },
  dragHandle: { 
    width: 40, height: 5, backgroundColor: '#DDD', alignSelf: 'center', borderRadius: 3, marginBottom: 15 
  },
  busTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  status: { color: 'green', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stat: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, width: '48%' },
  label: { fontSize: 12, color: COLORS.gray },
  val: { fontSize: 16, fontWeight: 'bold' },
  closeBtn: { 
    backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' 
  },
  btnText: { color: 'white', fontWeight: 'bold' }
});
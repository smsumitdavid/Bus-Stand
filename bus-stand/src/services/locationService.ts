import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const LocationService = {
  /**
   * Request Permissions and Get Current Location
   */
  getCurrentLocation: async (): Promise<Coordinates | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to find buses near you.');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error fetching location:', error);
      return null;
    }
  },

  /**
   * Calculate distance between two coordinates in Kilometers (Haversine Formula)
   */
  calculateDistance: (coord1: Coordinates, coord2: Coordinates): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    
    const R = 6371; // Radius of Earth in KM
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coord1.latitude)) * Math.cos(toRad(coord2.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in KM
    
    return parseFloat(distance.toFixed(1)); // Return with 1 decimal place
  }
};

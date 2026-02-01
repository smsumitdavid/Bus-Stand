/**
 * 🏷️ Application Data Models (Types)
 * Cleaned and Fixed Version
 */

// 1. User Interface
export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'passenger' | 'driver';
  pushToken?: string;
  createdAt?: string;
}

// 2. Stoppage Interface
export interface Stoppage {
  id?: string;
  name: string;
  time: string; // e.g., "10:30 AM"
  price: string; // e.g., "53"
  distance?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// 3. Bus Interface
export interface Bus {
  id: string;
  driverId: string;
  
  busName: string;
  busNo: string;
  
  startStand: string;
  startStandShort: string;
  startTime: string;
  
  endStand: string;
  endStandShort: string;
  endTime: string;
  
  totalDistanceTime: string;
  
  runDays: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  
  stoppages: Stoppage[];
  
  createdAt: string;
  isLive?: boolean;
}

// 4. Navigation Params
export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'bus/listing': { from: string; to: string };
  'bus/[id]': { id: string; fromStand: string; toStand: string };
  'bus/tracking': undefined;
};

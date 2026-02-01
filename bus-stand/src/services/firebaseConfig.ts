import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚙️ Firebase Configuration
// Values provided in your prompt
const firebaseConfig = {
  apiKey: "AIzaSyDhKJ-qlscfLglfBHchUuoRaZX-W5HajRw",
  authDomain: "bus-stand-e7801.firebaseapp.com",
  projectId: "bus-stand-e7801",
  storageBucket: "bus-stand-e7801.firebasestorage.app",
  messagingSenderId: "1074813424381",
  appId: "1:1074813424381:web:4d95140a9b6ad834c02494",
  measurementId: "G-XQH2QZPRB8"
};

let app: FirebaseApp;
let auth: Auth;

// ✅ Singleton Pattern: Ensure Firebase is only initialized once
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Fallback: use default web auth instance in this environment
  auth = getAuth(app);
} else {
  app = getApp();
  auth = getAuth(app);
}

const db: Firestore = getFirestore(app);

export { app, auth, db };

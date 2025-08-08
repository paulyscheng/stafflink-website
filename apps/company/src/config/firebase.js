import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration for StaffLink project
const firebaseConfig = {
  apiKey: "AIzaSyAIRT3SEbPcRTJHrJ-22Cfjxh45iRs3zoE",
  authDomain: "stafflink-b08be.firebaseapp.com",
  projectId: "stafflink-b08be",
  storageBucket: "stafflink-b08be.firebasestorage.app",
  messagingSenderId: "63231196625",
  appId: "1:63231196625:web:efbd602ff2e99735e4f4f0",
  measurementId: "G-7M7XJMH0PM"
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with better error handling
let auth;
try {
  // Check if auth is already initialized
  auth = getAuth(app);
} catch (error) {
  try {
    // Try to initialize with React Native persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (initError) {
    console.log('Auth initialization error:', initError);
    // Fallback to basic auth
    auth = getAuth(app);
  }
}

export { auth };
export default app;
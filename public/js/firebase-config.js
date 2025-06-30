// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWkXxtI9514_YD6H4kQ6IgltPoSSf7W80",
  authDomain: "medical-specialist-app-d3a46.firebaseapp.com",
  projectId: "medical-specialist-app-d3a46",
  storageBucket: "medical-specialist-app-d3a46.appspot.com",
  messagingSenderId: "990201081362",
  appId: "1:990201081362:web:273dbe33edbbee6f2bb2cb",
  measurementId: "G-ECMD5067CE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check if running in development mode
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Connect to emulators if in development
if (isDevelopment) {
  try {
    // Connect to Auth emulator
    if (!auth._delegate._config.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    }
    
    // Connect to Firestore emulator
    if (!db._delegate._databaseId.projectId.includes('demo-')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.warn('⚠️ Could not connect to emulators:', error.message);
  }
}

// Export Firebase services
export { app, auth, db, firebaseConfig };

// Global error handler for Firebase
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.code && event.reason.code.startsWith('auth/')) {
    console.error('Firebase Auth Error:', event.reason);
    // You can add custom error handling here
  }
});

console.log('🔥 Firebase initialized successfully');
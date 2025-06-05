import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWkXxtI9514_YD6H4kQ6IgltPoSSf7W80",
  authDomain: "medical-specialist-app-d3a46.firebaseapp.com",
  projectId: "medical-specialist-app-d3a46",
  storageBucket: "medical-specialist-app-d3a46.firebasestorage.app",
  messagingSenderId: "990201081362",
  appId: "1:990201081362:web:273dbe33edbbee6f2bb2cb",
    measurementId: "G-ECMD5067CE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
console.log(app.name);

// Export Firebase services for use in other files
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

export default app;
// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBWkXxtI9514_YD6H4kQ6IgltPoSSf7W80",
  authDomain: "medical-specialist-app-d3a46.firebaseapp.com",
  projectId: "medical-specialist-app-d3a46",
  storageBucket: "medical-specialist-app-d3a46.appspot.com",
  messagingSenderId: "990201081362",
  appId: "1:990201081362:web:273dbe33edbbee6f2bb2cb",
  measurementId: "G-ECMD5067CE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, Timestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase config
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
const db = getFirestore(app);

//tabs
document.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");

      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
      });

      document.getElementById(tabId).classList.add("active");
    });
  });

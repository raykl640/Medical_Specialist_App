import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;
    const docRef = doc(db, "patients", uid);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      document.getElementById("fullName").textContent = data.fullName || "";
      document.getElementById("dob").textContent = data.dateOfBirth || "";
      document.getElementById("sex").textContent = data.sex || "";
      document.getElementById("nid").textContent = data.nationalId || "";
      document.getElementById("phone").textContent = data.phone || "";
      document.getElementById("email").textContent = data.email || "";
      document.getElementById("address").textContent = data.homeAddress || "";

      document.getElementById("emgName").textContent = data.emergencyContact?.name || "";
      document.getElementById("emgPhone").textContent = data.emergencyContact?.phone || "";

      const allergies = data.knownAllergies || [];
      const allergyList = document.getElementById("allergyList");
      allergyList.innerHTML = allergies.length
        ? allergies.map(a => `<li>${a}</li>`).join('')
        : "<li>None reported</li>";
    } else {
      alert("Profile not found.");
    }
  } else {
    window.location.href = "/login.html"; // redirect if not logged in
  }
  
  const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            if (user.displayName) {
                userInitial.textContent = user.displayName.charAt(0).toUpperCase();
            } else if (user.email) {
                userInitial.textContent = user.email.charAt(0).toUpperCase();
            }
        }
});

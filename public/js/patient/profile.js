import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc, getDoc,
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
      // Full Name: Try to construct from firstName + otherNames if fullName is missing
      let fullName = data.fullName || ((data.firstName || "") + " " + (data.otherNames || "")).trim();
      document.getElementById("fullName").textContent = fullName || "-";
      // Date of Birth: try dob, fallback to dateOfBirth
      document.getElementById("dob").textContent = data.dob || data.dateOfBirth || "-";
      // Sex/Gender
      document.getElementById("sex").textContent = data.gender || data.sex || "-";
      // National ID
      document.getElementById("nid").textContent = data.nationalId || "-";
      // Phone
      document.getElementById("phone").textContent = data.phone || "-";
      // Email
      document.getElementById("email").textContent = data.email || "-";
      // Address
      document.getElementById("address").textContent = data.address || data.homeAddress || "-";

      // Emergency Contact
      let emgName = "-";
      let emgPhone = "-";
      if (data.emergencyContact) {
        // Try to construct name from firstName + otherNames if available
        if (data.emergencyContact.firstName) {
          emgName = (data.emergencyContact.firstName + " " + (data.emergencyContact.otherNames || "")).trim();
        } else if (data.emergencyContact.name) {
          emgName = data.emergencyContact.name;
        }
        emgPhone = data.emergencyContact.phone || "-";
      }
      document.getElementById("emgName").textContent = emgName;
      document.getElementById("emgPhone").textContent = emgPhone;

      // Allergies
      const allergies = data.knownAllergies || data.allergies || [];
      const allergyList = document.getElementById("allergyList");
      allergyList.innerHTML = Array.isArray(allergies) && allergies.length
        ? allergies.map(a => `<li>${a}</li>`).join('')
        : "<li>None reported</li>";
    } else {
      alert("Profile not found.");
    }
  } else {
    window.location.href = "/login.html"; // redirect if not logged in
  }

  // Set user initial robustly
  const userInitialEls = document.querySelectorAll('#userInitial');
  userInitialEls.forEach(userInitial => {
    let initial = 'U';
    if (user) {
      if (user.displayName && typeof user.displayName === 'string' && user.displayName.trim().length > 0) {
        initial = user.displayName.trim().charAt(0).toUpperCase();
      } else if (user.email && typeof user.email === 'string' && user.email.trim().length > 0) {
        initial = user.email.trim().charAt(0).toUpperCase();
      }
    }
    userInitial.textContent = initial;
  });
});

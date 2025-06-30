import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc, 
    getDoc,
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
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

async function logSystemEvent({ action, details }) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("logSystemEvent: No authenticated user");
      return;
    }
    await addDoc(collection(db, "systemLogs"), {
      timestamp: serverTimestamp(),
      action,
      userId: user.uid,
      userName: user.displayName || user.email || "Unknown User",
      role: "patient",
      details
    });
    console.log(`System event logged:`, action, details);
  } catch (err) {
    console.error("logSystemEvent: ", err);
  }
}

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

// --- Modal Logic ---
function showEditProfileModal(data) {
  const modalBackdrop = document.querySelector('#editProfileModal .modal-backdrop');
  if (!modalBackdrop) return;
  // Fill form fields
  document.getElementById('editFullName').value = data.fullName || ((data.firstName || "") + " " + (data.otherNames || "")).trim() || "";
  document.getElementById('editDob').value = data.dob || data.dateOfBirth || "";
  // Sex: set select value
  const sexValue = (data.gender || data.sex || "").toLowerCase();
  const sexSelect = document.getElementById('editSex');
  if (sexSelect) {
    sexSelect.value = ["male", "female", "other"].includes(sexValue) ? sexValue : "other";
  }
  document.getElementById('editNid').value = data.nationalId || "";
  document.getElementById('editPhone').value = data.phone || "";
  document.getElementById('editEmail').value = data.email || "";
  document.getElementById('editAddress').value = data.address || data.homeAddress || "";
  let emgName = "";
  let emgPhone = "";
  if (data.emergencyContact) {
    emgName = data.emergencyContact.firstName
      ? (data.emergencyContact.firstName + " " + (data.emergencyContact.otherNames || "")).trim()
      : (data.emergencyContact.name || "");
    emgPhone = data.emergencyContact.phone || "";
  }
  document.getElementById('editEmgName').value = emgName;
  document.getElementById('editEmgPhone').value = emgPhone;
  // Allergies: only if field exists in modal
  const allergiesField = document.getElementById('editAllergies');
  if (allergiesField) {
    allergiesField.value = (data.knownAllergies || data.allergies || []).join(", ");
  }
  modalBackdrop.style.display = 'flex';
}

function hideEditProfileModal() {
  const modalBackdrop = document.querySelector('#editProfileModal .modal-backdrop');
  if (modalBackdrop) modalBackdrop.style.display = 'none';
}

// --- Edit Profile Functionality (Modal) ---
const editBtn = document.getElementById("editBtn");
if (editBtn) {
  // Close modal logic
  document.getElementById('closeEditModal').onclick = hideEditProfileModal;
  // Form submit logic
  document.getElementById('editProfileForm').onsubmit = async function(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to edit your profile.");
      return;
    }
    const uid = user.uid;
    const docRef = doc(db, "patients", uid);
    // Gather form values
    const sexSelect = document.getElementById('editSex');
    const allergiesField = document.getElementById('editAllergies');
    const updateObj = {
      fullName: document.getElementById('editFullName').value.trim(),
      dob: document.getElementById('editDob').value,
      gender: sexSelect ? sexSelect.value : '',
      nationalId: document.getElementById('editNid').value,
      phone: document.getElementById('editPhone').value,
      email: document.getElementById('editEmail').value,
      address: document.getElementById('editAddress').value,
      emergencyContact: {
        name: document.getElementById('editEmgName').value,
        phone: document.getElementById('editEmgPhone').value
      },
    };
    if (allergiesField) {
      updateObj.knownAllergies = allergiesField.value
        ? allergiesField.value.split(',').map(a => a.trim()).filter(a => a)
        : [];
    }
    try {
      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(({ updateDoc }) =>
        updateDoc(docRef, updateObj)
      );
      await logSystemEvent({
        action: "profile update",
        details: `Updated profile for user ${uid}`
      });
      alert("Profile updated successfully.");
      hideEditProfileModal();
      window.location.reload();
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    }
  };
  // Open modal and populate fields
  editBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to edit your profile.");
      return;
    }
    const uid = user.uid;
    const docRef = doc(db, "patients", uid);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      alert("Profile not found.");
      return;
    }
    const data = snapshot.data();
    showEditProfileModal(data);
  });
}
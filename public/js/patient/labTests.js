// labTests.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const filterInput = document.getElementById("filterInput");
const sortSelect = document.getElementById("sortSelect");
const clinicFilter = document.getElementById("clinicFilter");
const specialistFilter = document.getElementById("specialistFilter");
const patientTbody = document.getElementById("patientTbody");

// Create modal
const modal = document.createElement("div");
modal.id = "modal";
modal.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
modal.innerHTML = `
  <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%;">
    <h3 id="modalTitle">Lab Test Details</h3>
    <pre id="modalBody" style="white-space: pre-wrap;"></pre>
    <button onclick="document.getElementById('modal').style.display='none'">Close</button>
  </div>
`;
document.body.appendChild(modal);

let labTests = [];

onAuthStateChanged(auth, user => {
  if (!user) return;
  console.log("Logged in user UID:", user.uid); // Debug

  const q = query(collection(db, "labTests"), where("patientId", "==", user.uid));
  onSnapshot(q, async snapshot => {
    console.log("Snapshot size:", snapshot.size); // Debug
    if (snapshot.empty) {
      labTests = [];
      populateFilters(labTests);
      filterAndSort();
      return;
    }

    const promises = snapshot.docs.map(async labDoc => {
      const data = labDoc.data();

      let clinicName = "Unknown";
      let specialistName = "Unknown";

      if (data.clinicId) {
        try {
          const clinicDoc = await getDoc(doc(db, "clinics", data.clinicId));
          if (clinicDoc.exists()) clinicName = clinicDoc.data().clinicName || clinicName;
        } catch (err) {
          console.error("Error fetching clinic:", err);
        }
      }

      if (data.historyId) {
        try {
          const historyDoc = await getDoc(doc(db, "medicalHistory", data.historyId));
          if (historyDoc.exists()) specialistName = historyDoc.data().specialistName || specialistName;
        } catch (err) {
          console.error("Error fetching specialist:", err);
        }
      }

      return {
        id: labDoc.id,
        ...data,
        clinicName,
        specialistName
      };
    });

    labTests = await Promise.all(promises);
    console.log("Lab Tests:", labTests); // Debug
    populateFilters(labTests);
    filterAndSort();
  });
});

function populateFilters(data) {
  const clinics = new Set();
  const specialists = new Set();

  data.forEach(item => {
    if (item.clinicName) clinics.add(item.clinicName);
    if (item.specialistName) specialists.add(item.specialistName);
  });

  clinicFilter.innerHTML = `<option value="">All Clinics</option>` +
    [...clinics].map(c => `<option value="${c}">${c}</option>`).join('');
  specialistFilter.innerHTML = `<option value="">All Specialists</option>` +
    [...specialists].map(s => `<option value="${s}">${s}</option>`).join('');
}

function filterAndSort() {
  const search = filterInput.value.toLowerCase();
  const clinicVal = clinicFilter.value;
  const specialistVal = specialistFilter.value;
  const sortVal = sortSelect.value;

  console.log({ search, clinicVal, specialistVal }); // Debug

  let filtered = [...labTests];

  if (search) {
    filtered = filtered.filter(t =>
      (t.testName || '').toLowerCase().includes(search) ||
      (t.clinicName || '').toLowerCase().includes(search) ||
      (t.specialistName || '').toLowerCase().includes(search)
    );
  }

  if (clinicVal) filtered = filtered.filter(t => t.clinicName === clinicVal);
  if (specialistVal) filtered = filtered.filter(t => t.specialistName === specialistVal);

  if (sortVal === "email") {
    filtered.sort((a, b) => (b.testDate?.toDate?.() - a.testDate?.toDate?.()));
  } else if (sortVal === "clinic") {
    filtered.sort((a, b) => (a.clinicName || '').localeCompare(b.clinicName || ''));
  } else if (sortVal === "specialist") {
    filtered.sort((a, b) => (a.specialistName || '').localeCompare(b.specialistName || ''));
  } else {
    filtered.sort((a, b) => (a.testName || '').localeCompare(b.testName || ''));
  }

  renderLabTests(filtered);
}

function renderLabTests(data) {
  patientTbody.innerHTML = '';
  if (data.length === 0) {
    patientTbody.innerHTML = `<tr><td colspan="6">No matching lab tests found.</td></tr>`;
    return;
  }

  data.forEach(test => {
    const tr = document.createElement("tr");
    const testDate = test.testDate?.toDate?.().toLocaleDateString() || "N/A";
    const latestResult = test.parameters?.[0]?.result || "N/A";

    tr.innerHTML = `
      <td>${test.testName || ''}</td>
      <td>${testDate}</td>
      <td>${test.clinicName || ''}</td>
      <td>${test.specialistName || ''}</td>
      <td>${latestResult}</td>
      <td><button onclick="showDetails('${encodeURIComponent(JSON.stringify(test))}')">View Record</button></td>
    `;

    patientTbody.appendChild(tr);
  });
}

window.showDetails = (encoded) => {
  const test = JSON.parse(decodeURIComponent(encoded));
  const testDate = test.testDate?.toDate?.().toLocaleDateString() || "N/A";

  let details = `Test Name: ${test.testName}\n`;
  details += `Date: ${testDate}\n`;
  details += `Clinic: ${test.clinicName}\n`;
  details += `Specialist: ${test.specialistName}\n\n`;

  details += "Parameters:\n";
  test.parameters?.forEach(p => {
    details += `- ${p.name}: ${p.result} ${p.unit} (Ref: ${p.referenceRange})\n`;
  });

  document.getElementById("modalBody").textContent = details;
  document.getElementById("modal").style.display = "flex";
};

filterInput.addEventListener("input", filterAndSort);
sortSelect.addEventListener("change", filterAndSort);
clinicFilter.addEventListener("change", filterAndSort);
specialistFilter.addEventListener("change", filterAndSort);

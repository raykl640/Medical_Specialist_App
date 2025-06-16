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


let medications = [];

onAuthStateChanged(auth, user => {
    if (!user) return;
    console.log("Logged in user UID:", user.uid); // Debug

    const q = query(collection(db, "medications"), where("patientId", "==", user.uid));
    onSnapshot(q, async snapshot => {
        console.log("Snapshot size:", snapshot.size); // Debug
        if (snapshot.empty) {
            medications = [];
            populateFilters(medications);
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

        medications = await Promise.all(promises);
        console.log("Medications:", medications); // Debug
        populateFilters(medications);
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

    let filtered = [...medications];

    if (search) {
        filtered = filtered.filter(m =>
            (m.medicineName || '').toLowerCase().includes(search) ||
            (m.clinicName || '').toLowerCase().includes(search) ||
            (m.specialistName || '').toLowerCase().includes(search)
        );
    }

    if (clinicVal) filtered = filtered.filter(m => m.clinicName === clinicVal);
    if (specialistVal) filtered = filtered.filter(m => m.specialistName === specialistVal);

     if (sortVal === "email") {
    filtered.sort((a, b) => (b.testDate?.toDate?.() - a.testDate?.toDate?.()));
  } else if (sortVal === "clinic") {
    filtered.sort((a, b) => (a.clinicName || '').localeCompare(b.clinicName || ''));
  } else if (sortVal === "specialist") {
    filtered.sort((a, b) => (a.specialistName || '').localeCompare(b.specialistName || ''));
  } else {
    filtered.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
  }

    rendermedications(filtered);
}

function rendermedications(data) {
    patientTbody.innerHTML = '';
    if (data.length === 0) {
        patientTbody.innerHTML = `<tr><td colspan="6">You have no medications.</td></tr>`;
        return;
    }

    data.forEach(medicine => {
        const tr = document.createElement("tr");
        const date = medicine.datePrescribed?.toDate?.().toLocaleDateString() || "N/A";

        tr.innerHTML = `
      <td>${medicine.medicineName || ''}</td>
      <td>${medicine.dosage || ''}</td>
      <td>${medicine.frequency || ''}</td>
      <td>${medicine.duration || ''}</td>
      <td>${date}</td>
      <td>${medicine.clinicName || ''}</td>
      <td>${medicine.specialistName || ''}</td>
    `;

        patientTbody.appendChild(tr);
    });
}

filterInput.addEventListener("input", filterAndSort);
sortSelect.addEventListener("change", filterAndSort);
clinicFilter.addEventListener("change", filterAndSort);
specialistFilter.addEventListener("change", filterAndSort);

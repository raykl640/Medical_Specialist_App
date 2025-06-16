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
import {
  setupViewToggle,
  setupPaginationControls,
  paginate
} from "./viewToggleAndPagination.js";

let filteredResults = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentView = "table";

import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const filterInput = document.getElementById("filterInput");
const sortSelect = document.getElementById("sortSelect");
const clinicFilter = document.getElementById("clinicFilter");
const specialistFilter = document.getElementById("specialistFilter");
const patientTbody = document.getElementById("patientTbody");
const cardContainer = document.getElementById("cardContainer");
const tableContainer = document.querySelector("table");

let medications = [];

// Setup view toggle once, outside of the auth state change
const viewToggleGetter = setupViewToggle("viewToggle", (view) => {
    console.log("Switching to view:", view);
  currentView = view;
  renderFilteredData(); // rerender when toggling view
}, "table"); // Set default view to table

onAuthStateChanged(auth, user => {
    if (!user) return;
    console.log("Logged in user UID:", user.uid); // Debug

    const q = query(collection(db, "medications"), where("patientId", "==", user.uid));
    onSnapshot(q, async snapshot => {
        console.log("Snapshot size:", snapshot.size); // Debug
        if (snapshot.empty) {
            medications = [];
            populateFilters(medications);
            renderFilteredData(); // Changed from filterAndSort() to renderFilteredData()
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
        renderFilteredData(); // Changed from filterAndSort() to renderFilteredData()
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

  // Sorting
  if (sortVal === "email") {
    filtered.sort((a, b) => (b.datePrescribed?.toDate?.() || 0) - (a.datePrescribed?.toDate?.() || 0));
  } else if (sortVal === "clinic") {
    filtered.sort((a, b) => (a.clinicName || '').localeCompare(b.clinicName || ''));
  } else if (sortVal === "specialist") {
    filtered.sort((a, b) => (a.specialistName || '').localeCompare(b.specialistName || ''));
  } else {
    filtered.sort((a, b) => (a.medicineName || '').localeCompare(b.medicineName || ''));
  }

  return filtered;
}

function rendermedications(data) {
    patientTbody.innerHTML = '';
    if (data.length === 0) {
        patientTbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;
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

function renderFilteredData() {
  const search = filterInput.value.toLowerCase();
  const clinicVal = clinicFilter.value;
  const specialistVal = specialistFilter.value;
  const sortVal = sortSelect.value;

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

  // Sorting
  if (sortVal === "email") {
    filtered.sort((a, b) => (b.datePrescribed?.toDate?.() || 0) - (a.datePrescribed?.toDate?.() || 0));
  } else if (sortVal === "clinic") {
    filtered.sort((a, b) => (a.clinicName || '').localeCompare(b.clinicName || ''));
  } else if (sortVal === "specialist") {
    filtered.sort((a, b) => (a.specialistName || '').localeCompare(b.specialistName || ''));
  } else {
    filtered.sort((a, b) => (a.medicineName || '').localeCompare(b.medicineName || ''));
  }

  // Reset pagination if needed
  if (currentPage > Math.ceil(filtered.length / itemsPerPage)) currentPage = 1;

  const paginatedData = paginate(filtered, itemsPerPage, currentPage);

  // Render based on view
  if (currentView === "card") {
    renderCards(paginatedData);
    if (tableContainer) tableContainer.style.display = "none";
    if (cardContainer) cardContainer.style.display = "grid";
  } else {
    rendermedications(paginatedData);
    if (tableContainer) tableContainer.style.display = "table";
    if (cardContainer) cardContainer.style.display = "none";
  }

  setupPaginationControls("paginationContainer", filtered.length, itemsPerPage, (page) => {
    currentPage = page;
    renderFilteredData(); // re-render on page change
  });
}

function renderCards(data) {
  const container = document.getElementById("cardContainer");
  if (!container) return;
  
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px;">You have no medications.</div>`;
    return;
  }

  data.forEach(medicine => {
    const date = medicine.datePrescribed?.toDate?.().toLocaleDateString() || "N/A";
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${medicine.medicineName || ''}</h3>
      <p><strong>Dosage:</strong> ${medicine.dosage || ''}</p>
      <p><strong>Frequency:</strong> ${medicine.frequency || ''}</p>
      <p><strong>Duration:</strong> ${medicine.duration || ''}</p>
      <p><strong>Prescribed on:</strong> ${date}</p>
      <p><strong>Clinic:</strong> ${medicine.clinicName || ''}</p>
      <p><strong>Specialist:</strong> ${medicine.specialistName || ''}</p>
    `;
    container.appendChild(card);
  });
}

filterInput.addEventListener("input", renderFilteredData);
sortSelect.addEventListener("change", renderFilteredData);
clinicFilter.addEventListener("change", renderFilteredData);
specialistFilter.addEventListener("change", renderFilteredData);
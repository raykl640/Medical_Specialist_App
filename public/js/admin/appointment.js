import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const filterInput = document.getElementById("filterInput");
const sortSelect = document.getElementById("sortSelect");
const patientTbody = document.getElementById("patientTbody");

let appointments = [];

// Initial load (optional since we have onSnapshot)
async function loadInitialAppointments() {
  const snapshot = await getDocs(collection(db, "appointments"));
  appointments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  filterAndSort();
}

// Real-time updates
const q = query(collection(db, "appointments"));
onSnapshot(q, (snapshot) => {
  appointments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  populateFilters(appointments);
  filterAndSort();
});

function populateFilters(data) {
    const clinics = new Set();
    const specialists = new Set();
    const specialties = new Set();

    data.forEach(item => {
        if (item.clinicName) clinics.add(item.clinicName);
        if (item.specialistName) specialists.add(item.specialistName);
        if (item.specialty) specialties.add(item.specialty);
    });

    clinicFilter.innerHTML = `<option value="">All Clinics</option>` +
        [...clinics].map(c => `<option value="${c}">${c}</option>`).join('');
    specialistFilter.innerHTML = `<option value="">All Specialists</option>` +
        [...specialists].map(s => `<option value="${s}">${s}</option>`).join('');
    specialtyFilter.innerHTML = `<option value="">All Specialties</option>` +
        [...specialties].map(sp => `<option value="${sp}">${sp}</option>`).join('');
}
function filterAndSort() {
    let filtered = [...appointments];
    const search = filterInput.value.toLowerCase();
    const clinicVal = clinicFilter.value;
    const specialistVal = specialistFilter.value;
    const specialtyVal = specialtyFilter.value;

    if (search) {
        filtered = filtered.filter(p =>
            (p.patientEmail || '').toLowerCase().includes(search) ||
            (p.clinicName || '').toLowerCase().includes(search) ||
            (p.specialistName || '').toLowerCase().includes(search)
        );
    }

    if (clinicVal) {
        filtered = filtered.filter(p => p.clinicName === clinicVal);
    }

    if (specialistVal) {
        filtered = filtered.filter(p => p.specialistName === specialistVal);
    }

    if (specialtyVal) {
        filtered = filtered.filter(p => p.specialty === specialtyVal);
    }

    const sortBy = sortSelect.value;
    if (sortBy === 'patientEmail') {
        filtered.sort((a, b) => (a.patientEmail || '').localeCompare(b.patientEmail || ''));
    } else if (sortBy === 'clinicName') {
        filtered.sort((a, b) => (a.clinicName || '').localeCompare(b.clinicName || ''));
    } else if (sortBy === 'specialistName') {
        filtered.sort((a, b) => (a.specialistName || '').localeCompare(b.specialistName || ''));
    } else if (sortBy === 'specialty') {
        filtered.sort((a, b) => (a.specialty || '').localeCompare(b.specialty || ''));
    } else if (sortBy === 'date') {
        filtered.sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.());
    }

    renderAppointments(filtered);
}

function renderAppointments(data) {
  patientTbody.innerHTML = '';
  if (data.length === 0) {
    patientTbody.innerHTML = `<tr><td colspan="6">No matching appointments found.</td></tr>`;
    return;
  }

  data.forEach(app => {
    const tr = document.createElement("tr");
    const date = app.date?.toDate?.().toLocaleString() || "N/A";

    tr.innerHTML = `
      <td>${app.patientEmail || ''}</td>
      <td>${app.clinicName || ''}</td>
      <td>${app.specialistName || ''}</td>
      <td>${app.specialty || ''}</td>
      <td>${app.status || ''}</td>
      <td>${date}</td>
    `;
    patientTbody.appendChild(tr);
  });
}

// Event listeners
filterInput.addEventListener("input", filterAndSort);
sortSelect.addEventListener("change", filterAndSort);
clinicFilter.addEventListener("change", filterAndSort);
specialistFilter.addEventListener("change", filterAndSort);
specialtyFilter.addEventListener("change", filterAndSort);

// Optional: call if you want an initial non-realtime fetch
loadInitialAppointments();

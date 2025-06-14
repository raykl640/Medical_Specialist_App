import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const filterInput = document.getElementById("filterInput");
const sortSelect = document.getElementById("sortSelect");
const patientTbody = document.getElementById("patientTbody");

let patients = [];

// ✅ Initial fetch with getDocs()
async function loadInitialPatients() {
    const snapshot = await getDocs(collection(db, "patients"));
    patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    filterAndSort();
}

// ✅ Real-time updates
const q = query(collection(db, "patients"));
onSnapshot(q, (snapshot) => {
    patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    filterAndSort();
});

// ✅ Filter + Sort
function filterAndSort() {
    let filtered = [...patients];
    const search = filterInput.value.toLowerCase();

    if (search) {
        filtered = filtered.filter(p =>
            (p.firstName || '').toLowerCase().includes(search) ||
            (p.otherNames || '').toLowerCase().includes(search) ||
            (p.email || '').toLowerCase().includes(search)
        );
    }

    const sortBy = sortSelect.value;
    if (sortBy === 'firstName') {
        filtered.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
    } else if (sortBy === 'email') {
        filtered.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    } else if (sortBy === 'createdAt') {
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
    }


    renderPatients(filtered);
}

// ✅ Render table
function renderPatients(data) {
    patientTbody.innerHTML = '';
    if (data.length === 0) {
        patientTbody.innerHTML = `<tr><td colspan="4">No matching patients found.</td></tr>`;
        return;
    }

    data.forEach(p => {
        const tr = document.createElement("tr");
       const createdAt = p.createdAt
  ? new Date(p.createdAt).toLocaleString()
  : "N/A";

        tr.innerHTML = `
      <td>${p.firstName || ''}</td>
      <td>${p.otherNames || ''}</td>
      <td>${p.email || ''}</td>
      <td>${createdAt}</td>
    `;
        patientTbody.appendChild(tr);
    });
}

// ✅ Event listeners
filterInput.addEventListener("input", filterAndSort);
sortSelect.addEventListener("change", filterAndSort);

// Load initial
loadInitialPatients();

// medicalHistory.js
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
import {
    setupViewToggle,
    paginate,
    setupPaginationControls
} from "./viewToggleAndPagination.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const filterInput = document.getElementById("filterInput");
const sortSelect = document.getElementById("sortSelect");
const clinicFilter = document.getElementById("clinicFilter");
const specialistFilter = document.getElementById("specialistFilter");
const medicalHistoryTbody = document.getElementById("medicalHistoryTbody");
const paginationContainer = document.getElementById("paginationContainer");
const medicalHistoryCards = document.getElementById("medicalHistoryCards");

let medicalHistory = [];
let filteredResults = [];
let currentPage = 1;
const itemsPerPage = 5;

// Modal
const modal = document.createElement("div");
modal.id = "modal";
modal.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(18, 18, 18, 0.21);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
modal.innerHTML = `
  <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%;">
    <h3 id="modalTitle">Medical History Details</h3>
    <pre id="modalBody" style="white-space: pre-wrap;"></pre>
    <button onclick="document.getElementById('modal').style.display='none'">Close</button>
  </div>
`;
document.body.appendChild(modal);

// View toggle setup
let currentViewMode = "table";

const getViewMode = setupViewToggle("viewToggle", (newMode) => {
    currentViewMode = newMode;
    // Reset to first page when changing views
    currentPage = 1;
    const paginated = paginate(filteredResults, itemsPerPage, currentPage);
    rendermedicalHistory(paginated, currentViewMode);
    
    // Update pagination controls
    setupPaginationControls(
        "paginationContainer",
        filteredResults.length,
        itemsPerPage,
        (newPage) => {
            currentPage = newPage;
            const newPaginated = paginate(filteredResults, itemsPerPage, currentPage);
            rendermedicalHistory(newPaginated, currentViewMode);
        }
    );
}, currentViewMode);

onAuthStateChanged(auth, user => {
    if (!user) return;

    const q = query(collection(db, "medicalHistory"), where("patientId", "==", user.uid));
    onSnapshot(q, async snapshot => {
        if (snapshot.empty) {
            medicalHistory = [];
            populateFilters([]);
            filterAndSort();
            return;
        }

        const promises = snapshot.docs.map(async labDoc => {
            const data = labDoc.data();

            let clinicName = "Unknown";

            if (data.clinicId) {
                try {
                    const clinicDoc = await getDoc(doc(db, "clinics", data.clinicId));
                    if (clinicDoc.exists()) clinicName = clinicDoc.data().clinicName || clinicName;
                } catch (err) {
                    console.error("Error fetching clinic:", err);
                }
            }

            return {
                id: labDoc.id,
                ...data,
                clinicName
            };
        });

        medicalHistory = await Promise.all(promises);
        populateFilters(medicalHistory);
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

    let filtered = [...medicalHistory];

    if (search) {
        filtered = filtered.filter(h =>
            (h.specialty || '').toLowerCase().includes(search) ||
            (h.clinicName || '').toLowerCase().includes(search) ||
            (h.specialistName || '').toLowerCase().includes(search)
        );
    }

    if (clinicVal) filtered = filtered.filter(h => h.clinicName === clinicVal);
    if (specialistVal) filtered = filtered.filter(h => h.specialistName === specialistVal);

    if (sortVal === "email") {
        filtered.sort((a, b) => (b.VisitDate?.toDate?.() - a.VisitDate?.toDate?.()));
    } else if (sortVal === "clinic") {
        filtered.sort((a, b) => (a.clinicName || '').localeCompare(b.clinicName || ''));
    } else if (sortVal === "specialist") {
        filtered.sort((a, b) => (a.specialistName || '').localeCompare(b.specialistName || ''));
    } else if (sortVal === "specialty") {
        filtered.sort((a, b) => (a.specialty || '').localeCompare(b.specialty || ''));
    } else {
        filtered.sort((a, b) => (a.VisitDate || '').localeCompare(b.VisitDate || ''));
    }

    filteredResults = filtered;
    currentPage = 1; // Reset to first page when filtering

    const paginated = paginate(filteredResults, itemsPerPage, currentPage);
    rendermedicalHistory(paginated, currentViewMode);

    setupPaginationControls(
        "paginationContainer",
        filteredResults.length,
        itemsPerPage,
        (newPage) => {
            currentPage = newPage;
            const newPaginated = paginate(filteredResults, itemsPerPage, currentPage);
            rendermedicalHistory(newPaginated, currentViewMode);
        }
    );
}

function rendermedicalHistory(data, viewMode) {

    // Clear both containers
    medicalHistoryTbody.innerHTML = '';
    medicalHistoryCards.innerHTML = '';

    if (data.length === 0) {
        if (viewMode === "card") {
            medicalHistoryCards.innerHTML = `<p>Loading...</p>`;
        } else {
            medicalHistoryTbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;
        }
        return;
    }

    if (viewMode === "card") {
        medicalHistoryCards.style.display = "grid";
        medicalHistoryTbody.parentElement.style.display = "none";

        data.forEach(hist => {
            const date = hist.visitDate?.toDate?.().toLocaleDateString() || "N/A";
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
        <h4><strong>Visit Date:</strong> ${date}</h4>
        <p><strong>Clinic:</strong> ${hist.clinicName || ''}</p>
        <p><strong>Specialist:</strong> ${hist.specialistName || ''}</p>
        <p><strong>Specialty:</strong> ${hist.specialistType || ''}</p>
        <p><strong>Diagnosis Summary:</strong> ${hist.diagnosisSummary || ''}</p>
        <button onclick="showDetails('${encodeURIComponent(JSON.stringify(hist))}')">View Full Record</button>
      `;
            medicalHistoryCards.appendChild(card);
        });
    } else {
        medicalHistoryCards.style.display = "none";
        medicalHistoryTbody.parentElement.style.display = "table";

        data.forEach(hist => {
            const date = hist.visitDate?.toDate?.().toLocaleDateString() || "N/A";
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${date}</td>
        <td>${hist.clinicName || ''}</td>
        <td>${hist.specialistName || ''}</td>
        <td>${hist.specialistType || ''}</td>
        <td>${hist.diagnosisSummary || ''}</td>
        <td><button onclick="showDetails('${encodeURIComponent(JSON.stringify(hist))}')">View Record</button></td>
      `;
            medicalHistoryTbody.appendChild(tr);
        });
    }
}

window.showDetails = (encoded) => {
    const hist = JSON.parse(decodeURIComponent(encoded));
    const date = hist.visitDate?.toDate?.().toLocaleDateString() || "N/A";

    let details = `Visit Date: ${date}\n`;
    details += `Clinic: ${hist.clinicName}\n`;
    details += `Specialist: ${hist.specialistName}\n`;
    details += `Specialty: ${hist.specialty}\n`;

    document.getElementById("modalBody").textContent = details;
    document.getElementById("modal").style.display = "flex";
};

// Event Listeners
filterInput.addEventListener("input", filterAndSort);
sortSelect.addEventListener("change", filterAndSort);
clinicFilter.addEventListener("change", filterAndSort);
specialistFilter.addEventListener("change", filterAndSort);

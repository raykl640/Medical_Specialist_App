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
const labTestsTbody = document.getElementById("labTestsTbody");
const paginationContainer = document.getElementById("paginationContainer");
const labTestsCards = document.getElementById("labTestsCards");

let labTests = [];
let filteredResults = [];
let currentPage = 1;
const itemsPerPage = 5;

// Modal creation
const labTestModal = document.createElement("div");
labTestModal.id = "labTestModal";
labTestModal.style.cssText = `
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

labTestModal.innerHTML = `
  <div class="modal-content">
    <div class="modal-header">
      <h3>Lab Test Details</h3>
      <button class="close" onclick="document.getElementById('labTestModal').style.display='none'">&times;</button>
    </div>
    <div id="labTestModalBody" class="modal-body"></div>
  </div>
`;

document.body.appendChild(labTestModal);

// View toggle setup
let currentViewMode = "table";

const getViewMode = setupViewToggle("labViewToggle", (newMode) => {
    currentViewMode = newMode;
    // Reset to first page when changing views
    currentPage = 1;
    const paginated = paginate(filteredResults, itemsPerPage, currentPage);
    renderLabTests(paginated, currentViewMode);
    
    // Update pagination controls
    setupPaginationControls(
        "paginationContainer",
        filteredResults.length,
        itemsPerPage,
        (newPage) => {
            currentPage = newPage;
            const newPaginated = paginate(filteredResults, itemsPerPage, currentPage);
            renderLabTests(newPaginated, currentViewMode);
        }
    );
}, currentViewMode);

onAuthStateChanged(auth, user => {
  if (!user) return;

  const q = query(collection(db, "labTests"), where("patientId", "==", user.uid));
  onSnapshot(q, async snapshot => {
    if (snapshot.empty) {
      labTests = [];
      populateFilters([]);
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

    filteredResults = filtered;
    currentPage = 1; // Reset to first page when filtering

    const paginated = paginate(filteredResults, itemsPerPage, currentPage);
    renderLabTests(paginated, currentViewMode);

    setupPaginationControls(
        "paginationContainer",
        filteredResults.length,
        itemsPerPage,
        (newPage) => {
            currentPage = newPage;
            const newPaginated = paginate(filteredResults, itemsPerPage, currentPage);
            renderLabTests(newPaginated, currentViewMode);
        }
    );
}

function renderLabTests(data, viewMode) {

  // Clear both containers
  labTestsTbody.innerHTML = '';
  labTestsCards.innerHTML = '';

  if (data.length === 0) {
    if (viewMode === "card") {
      labTestsCards.innerHTML = `<p>Loading...</p>`;
    } else {
      labTestsTbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;
    }
    return;
  }

  if (viewMode === "card") {
    labTestsCards.style.display = "grid";
    labTestsTbody.parentElement.style.display = "none";

    data.forEach(test => {
      const testDate = test.testDate?.toDate?.().toLocaleDateString() || "N/A";
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h4>${test.testName || ''}</h4>
        <p><strong>Date:</strong> ${testDate}</p>
        <p><strong>Clinic:</strong> ${test.clinicName || ''}</p>
        <p><strong>Specialist:</strong> ${test.specialistName || ''}</p>
        <p><strong>Result:</strong> ${test.parameters?.[0]?.result || 'N/A'}</p>
        <button onclick="showLabTestDetails('${encodeURIComponent(JSON.stringify(test))}')">View Full Record</button>
      `;
      labTestsCards.appendChild(card);
    });
  } else {
    labTestsCards.style.display = "none";
    labTestsTbody.parentElement.style.display = "table";

    data.forEach(test => {
      const testDate = test.testDate?.toDate?.().toLocaleDateString() || "N/A";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${test.testName || ''}</td>
        <td>${testDate}</td>
        <td>${test.clinicName || ''}</td>
        <td>${test.specialistName || ''}</td>
        <td>${test.parameters?.[0]?.result || 'N/A'}</td>
        <td><button onclick="showLabTestDetails('${encodeURIComponent(JSON.stringify(test))}')">View Full Record</button></td>
      `;
      labTestsTbody.appendChild(tr);
    });
  }
}

window.showLabTestDetails = (encoded) => {
  const test = JSON.parse(decodeURIComponent(encoded));
  const testDate = test.testDate?.seconds ? new Date(test.testDate.seconds * 1000).toLocaleDateString() : "N/A";

  let body = `
    <div class="modal-row"><strong>Test Date:</strong> ${testDate}</div>
    <div class="modal-row"><strong>Clinic:</strong> ${test.clinicName || 'N/A'}</div>
    <div class="modal-row"><strong>Test Name:</strong> ${test.testName || 'N/A'}</div>
    <div class="modal-row"><strong>Requested By:</strong> ${test.requestedBy || 'N/A'}</div>
  `;

  if (Array.isArray(test.parameters)) {
    body += `<div class="modal-row"><strong>Parameters:</strong><ul style="padding-left: 20px;">`;
    test.parameters.forEach(p => {
      body += `<li>${p.name || 'Unnamed'}: ${p.result || 'N/A'} ${p.unit || ''} (Ref: ${p.referenceRange || 'N/A'})</li>`;
    });
    body += `</ul></div>`;
  }

  document.getElementById("labTestModalBody").innerHTML = body;
  document.getElementById("labTestModal").style.display = "flex";
};

// Event Listeners
filterInput.addEventListener("input", filterAndSort);
sortSelect.addEventListener("change", filterAndSort);
clinicFilter.addEventListener("change", filterAndSort);
specialistFilter.addEventListener("change", filterAndSort);

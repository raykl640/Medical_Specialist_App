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
const radiologyTbody = document.getElementById("radiologyTbody");
const radiologyCards = document.getElementById("radiologyCards");
const paginationContainer = document.getElementById("paginationContainer");

let radiologyTests = [];
let filteredResults = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentViewMode = "table";

// Create modal
const radiologyModal = document.createElement("div");
radiologyModal.id = "radiologyModal";
radiologyModal.style.cssText = `
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
radiologyModal.innerHTML = `
  <div class="modal-content">
    <div class="modal-header">
      <h3>Radiology Test Details</h3>
      <button onclick="document.getElementById('radiologyModal').style.display='none'">&times;</button>
    </div>
    <div id="radiologyModalBody" class="modal-body" style="margin-top: 20px;"></div>
  </div>
`;
document.body.appendChild(radiologyModal);

// Setup view toggle
const getViewMode = setupViewToggle("radiologyViewToggle", (newMode) => {
  currentViewMode = newMode;
  currentPage = 1;
  const paginated = paginate(filteredResults, itemsPerPage, currentPage);
  renderRadiologyTests(paginated, currentViewMode);
  setupPagination();
}, currentViewMode);

onAuthStateChanged(auth, user => {
  if (!user) return;

  const q = query(collection(db, "radiologyTests"), where("patientId", "==", user.uid));
  onSnapshot(q, async snapshot => {
    if (snapshot.empty) {
      radiologyTests = [];
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

    radiologyTests = await Promise.all(promises);
    populateFilters(radiologyTests);
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

  let filtered = [...radiologyTests];

  if (search) {
    filtered = filtered.filter(r =>
      (r.type || '').toLowerCase().includes(search) ||
      (r.clinicName || '').toLowerCase().includes(search) ||
      (r.specialistName || '').toLowerCase().includes(search)
    );
  }

  if (clinicVal) filtered = filtered.filter(r => r.clinicName === clinicVal);
  if (specialistVal) filtered = filtered.filter(r => r.specialistName === specialistVal);

  switch (sortVal) {
    case "email":
      filtered.sort((a, b) => (b.testDate?.toDate?.() - a.testDate?.toDate?.()));
      break;
    case "clinic":
      filtered.sort((a, b) => (a.clinicName || '').localeCompare(b.clinicName || ''));
      break;
    case "specialist":
      filtered.sort((a, b) => (a.specialistName || '').localeCompare(b.specialistName || ''));
      break;
    default:
      filtered.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
  }

  filteredResults = filtered;
  currentPage = 1;
  const paginated = paginate(filteredResults, itemsPerPage, currentPage);
  renderRadiologyTests(paginated, getViewMode());
  setupPagination();
}

function setupPagination() {
  setupPaginationControls(
    "paginationContainer",
    filteredResults.length,
    itemsPerPage,
    (newPage) => {
      currentPage = newPage;
      const paginated = paginate(filteredResults, itemsPerPage, currentPage);
      renderRadiologyTests(paginated, getViewMode());
    }
  );
}

function renderRadiologyTests(data, viewMode) {
  radiologyTbody.innerHTML = '';
  radiologyCards.innerHTML = '';

  if (data.length === 0) {
    if (viewMode === "card") {
      radiologyCards.innerHTML = `<p>No matching radiology tests found.</p>`;
    } else {
      radiologyTbody.innerHTML = `<tr><td colspan="6">No data found.</td></tr>`;
    }
    return;
  }

  if (viewMode === "card") {
    radiologyCards.style.display = "grid";
    radiologyTbody.parentElement.style.display = "none";

    data.forEach(test => {
      const testDate = test.testDate?.toDate?.().toLocaleDateString() || "N/A";
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h4><strong>Test Type:</strong> ${test.type || ''}</h4>
        <p><strong>Date Conducted:</strong> ${testDate}</p>
        <p><strong>Clinic:</strong> ${test.clinicName || ''}</p>
        <p><strong>Specialist:</strong> ${test.specialistName || ''}</p>
        <p><strong>Result:</strong> ${test.report || ''}</p>
        <button onclick="showRadiologyDetails('${encodeURIComponent(JSON.stringify(test))}')">View Full Record</button>
      `;
      radiologyCards.appendChild(card);
    });
  } else {
    radiologyCards.style.display = "none";
    radiologyTbody.parentElement.style.display = "table";

    data.forEach(test => {
      const testDate = test.testDate?.toDate?.().toLocaleDateString() || "N/A";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${test.type || ''}</td>
        <td>${testDate}</td>
        <td>${test.clinicName || ''}</td>
        <td>${test.specialistName || ''}</td>
        <td>${test.report || ''}</td>
        <td><button onclick="showRadiologyDetails('${encodeURIComponent(JSON.stringify(test))}')">View Record</button></td>
      `;
      radiologyTbody.appendChild(tr);
    });
  }
}

window.showRadiologyDetails = (encoded) => {
  const test = JSON.parse(decodeURIComponent(encoded));
  const seconds = test.testDate?.seconds;
  const testDate = seconds ? new Date(seconds * 1000).toLocaleDateString() : "N/A";


  const fields = [
    ["Test Type", test.type],
    ["Date Conducted", testDate],
    ["Clinic", test.clinicName],
    ["Specialist", test.specialistName],
    ["Result", test.report]
  ];

  const body = fields.map(
    ([label, value]) => `<div class="modal-row"><strong>${label}:</strong> ${value || 'N/A'}</div>`
  ).join("");

  document.getElementById("radiologyModalBody").innerHTML = body;
  document.getElementById("radiologyModal").style.display = "flex";
};

// Filters
filterInput.addEventListener("input", filterAndSort);
sortSelect.addEventListener("change", filterAndSort);
clinicFilter.addEventListener("change", filterAndSort);
specialistFilter.addEventListener("change", filterAndSort);

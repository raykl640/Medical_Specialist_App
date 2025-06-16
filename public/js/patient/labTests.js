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
const patientTbody = document.getElementById("patientTbody");
const paginationContainer = document.getElementById("paginationContainer");
const cardContainer = document.getElementById("cardContainer");

let labTests = [];
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

// View toggle setup
let currentViewMode = "card";

const getViewMode = setupViewToggle("viewToggle", (newMode) => {
  currentViewMode = newMode;
  const paginated = paginate(filteredResults, currentPage, itemsPerPage);
  renderLabTests(paginated, currentViewMode);
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

  const paginated = paginate(filteredResults, itemsPerPage, currentPage);
  renderLabTests(paginated, getViewMode());

  setupPaginationControls(
    "paginationContainer",
    filteredResults.length,
    itemsPerPage,
    (newPage) => {
      currentPage = newPage;
      const newPaginated = paginate(filteredResults, itemsPerPage, currentPage);
      renderLabTests(newPaginated, getViewMode());
    }
  );

}

function renderLabTests(data, viewMode) {
  const cardContainer = document.getElementById("cardContainer");

  // Clear both containers
  patientTbody.innerHTML = '';
  cardContainer.innerHTML = '';

  if (data.length === 0) {
    if (viewMode === "card") {
      cardContainer.innerHTML = `<p>No matching lab tests found.</p>`;
    } else {
      patientTbody.innerHTML = `<tr><td colspan="6">No matching lab tests found.</td></tr>`;
    }
    return;
  }

  if (viewMode === "card") {
    cardContainer.style.display = "grid";
    patientTbody.parentElement.style.display = "none";

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
        <button onclick="showDetails('${encodeURIComponent(JSON.stringify(test))}')">View Record</button>
      `;
      cardContainer.appendChild(card);
    });
  } else {
    cardContainer.style.display = "none";
    patientTbody.parentElement.style.display = "table";

    data.forEach(test => {
      const testDate = test.testDate?.toDate?.().toLocaleDateString() || "N/A";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${test.testName || ''}</td>
        <td>${testDate}</td>
        <td>${test.clinicName || ''}</td>
        <td>${test.specialistName || ''}</td>
        <td>${test.parameters?.[0]?.result || 'N/A'}</td>
        <td><button onclick="showDetails('${encodeURIComponent(JSON.stringify(test))}')">View Record</button></td>
      `;
      patientTbody.appendChild(tr);
    });
  }
}


window.showDetails = (encoded) => {
  const test = JSON.parse(decodeURIComponent(encoded));
  const testDate = test.testDate?.toDate?.().toLocaleString() || "N/A";

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

// Event Listeners
filterInput.addEventListener("input", filterAndSort);
sortSelect.addEventListener("change", filterAndSort);
clinicFilter.addEventListener("change", filterAndSort);
specialistFilter.addEventListener("change", filterAndSort);

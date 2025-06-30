import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Matching your HTML element IDs
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const logsTbody = document.getElementById("logsTbody");

let logs = [];

// Initial fetch (optional)
async function loadInitialLogs() {
  const snapshot = await getDocs(collection(db, "systemLogs"));
  logs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
  }));
  filterLogs();
}

// Real-time updates
const q = query(collection(db, "systemLogs"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
  logs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
  }));
  filterLogs();
});

// Filtering function
function filterLogs() {
  let filtered = [...logs];
  const search = searchInput.value.toLowerCase();
  const role = roleFilter.value;
  const start = startDateInput.value ? new Date(startDateInput.value) : null;
  const end = endDateInput.value ? new Date(endDateInput.value + "T23:59:59") : null;

  if (search) {
    filtered = filtered.filter(log =>
      (log.action || "").toLowerCase().includes(search) ||
      (log.userName || "").toLowerCase().includes(search)
    );
  }

  if (role) {
    filtered = filtered.filter(log => log.role === role);
  }

  if (start) {
    filtered = filtered.filter(log => log.timestamp >= start);
  }

  if (end) {
    filtered = filtered.filter(log => log.timestamp <= end);
  }

  renderLogs(filtered);
}

// Render logs to table
function renderLogs(data) {
  logsTbody.innerHTML = "";

  if (data.length === 0) {
    logsTbody.innerHTML = `<tr><td colspan="5">No logs found.</td></tr>`;
    return;
  }

  data.forEach(log => {
    const tr = document.createElement("tr");
    const timestamp = log.timestamp instanceof Date
      ? log.timestamp.toLocaleString()
      : "N/A";

    tr.innerHTML = `
      <td>${log.action || ""}</td>
      <td>${log.userName || ""}</td>
      <td>${log.role || ""}</td>
      <td>${timestamp}</td>
      <td><pre style="white-space: pre-wrap; font-size: 13px;">${JSON.stringify(log.details || {}, null, 2)}</pre></td>
    `;
    logsTbody.appendChild(tr);
  });
}

// Event listeners
searchInput.addEventListener("input", filterLogs);
roleFilter.addEventListener("change", filterLogs);
startDateInput.addEventListener("change", filterLogs);
endDateInput.addEventListener("change", filterLogs);

// Optional initial load
loadInitialLogs();

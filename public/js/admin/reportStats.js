import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, Timestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBWkXxtI9514_YD6H4kQ6IgltPoSSf7W80",
    authDomain: "medical-specialist-app-d3a46.firebaseapp.com",
    projectId: "medical-specialist-app-d3a46",
    storageBucket: "medical-specialist-app-d3a46.appspot.com",
    messagingSenderId: "990201081362",
    appId: "1:990201081362:web:273dbe33edbbee6f2bb2cb",
    measurementId: "G-ECMD5067CE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to fetch and display totals
async function getTotalPatients() {
    try {
        const snapshot = await getDocs(collection(db, "patients"));
        const total = snapshot.size;
        document.getElementById("patient-count").innerText = total;
    } catch (error) {
        console.error("Error fetching total patients:", error);
    }
}

async function getTotalClincs() {
    try {
        const snapshot = await getDocs(collection(db, "clinics"));
        const total = snapshot.size;
        document.getElementById("clinics-count").innerText = total;
    } catch (error) {
        console.error("Error fetching total clinics:", error);
    }
}

async function getTotalAppointments() {
    try {
        const snapshot = await getDocs(collection(db, "appointments"));
        const total = snapshot.size;
        document.getElementById("appointments-count").innerText = total;
    } catch (error) {
        console.error("Error fetching total appointments:", error);
    }
}


async function getTotalHealthResources() {
    try {
        const snapshot = await getDocs(collection(db, "healthResources"));
        const total = snapshot.size;
        document.getElementById("health-resources-count").innerText = total;
    } catch (error) {
        console.error("Error fetching total health resources:", error);
    }
}

async function getTotalSystemLogs() {
    try {
        const snapshot = await getDocs(collection(db, "systemLogs"));
        const total = snapshot.size;
        document.getElementById("system-logs-count").innerText = total;
    } catch (error) {
        console.error("Error fetching total system logs:", error);
    }
}

getTotalPatients();
getTotalClincs();
getTotalAppointments();
getTotalHealthResources();
getTotalSystemLogs();

//tabs
document.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");

      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
      });

      document.getElementById(tabId).classList.add("active");
    });
  });

//Populating the tables

//  Patients Report Logic
const patientTbody = document.getElementById("patientsReportBody");
let patients = [];

async function loadPatients() {
  const snapshot = await getDocs(collection(db, "patients"));
  patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderPatients(patients);
}

function renderPatients(data) {
  patientTbody.innerHTML = '';
  if (data.length === 0) {
    patientTbody.innerHTML = `<tr><td colspan="5">No patients found.</td></tr>`;
    return;
  }

  data.forEach(p => {
    let createdAt = "N/A";
    if (typeof p.createdAt === 'string') {
      const dateObj = new Date(p.createdAt);
      createdAt = isNaN(dateObj.getTime()) ? p.createdAt : dateObj.toLocaleDateString();
    } else if (p.createdAt?.seconds) {
      createdAt = new Date(p.createdAt.seconds * 1000).toLocaleDateString();
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.firstName || ''}</td>
      <td>${p.otherNames || ''}</td>
      <td>${p.email || ''}</td>
      <td>${createdAt}</td>
    `;
    patientTbody.appendChild(tr);
  });
}

loadPatients();
onSnapshot(query(collection(db, "patients")), snapshot => {
  patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderPatients(patients);
});

//  Clinics Report Logic
const clinicsTbody = document.getElementById("clinicsReportBody");
let clinics = [];

async function loadClinics() {
  const snapshot = await getDocs(collection(db, "clinics"));
  clinics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderClinics(clinics);
}

function renderClinics(data) {
  clinicsTbody.innerHTML = '';
  if (data.length === 0) {
    clinicsTbody.innerHTML = `<tr><td colspan="5">No clinics found.</td></tr>`;
    return;
  }

  data.forEach(c => {
    const createdAt = c.createdAt?.seconds
      ? new Date(c.createdAt.seconds * 1000).toLocaleDateString()
      : "N/A";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.clinicName || ''}</td>
      <td>${c.location || ''}</td>
      <td>${createdAt}</td>
      <td>${c.totalPatients || '—'}</td>
    `;
    clinicsTbody.appendChild(tr);
  });
}

loadClinics();
onSnapshot(query(collection(db, "clinics")), snapshot => {
  clinics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderClinics(clinics);
});

//  Appointments Report Logic
const appointmentsTbody = document.getElementById("appointmentsReportBody");
let appointments = [];

async function loadAppointments() {
  const snapshot = await getDocs(collection(db, "appointments"));
  appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderAppointments(appointments);
}

function renderAppointments(data) {
  appointmentsTbody.innerHTML = '';
  if (data.length === 0) {
    appointmentsTbody.innerHTML = `<tr><td colspan="5">No appointments found.</td></tr>`;
    return;
  }

  data.forEach(a => {
    const date = a.date?.seconds
      ? new Date(a.date.seconds * 1000).toLocaleDateString()
      : "N/A";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.patientEmail || '—'}</td>
      <td>${a.clinicName || '—'}</td>
      <td>${date}</td>
      <td>${a.status || 'Pending'}</td>
    `;
    appointmentsTbody.appendChild(tr);
  });
}

loadAppointments();
onSnapshot(query(collection(db, "appointments")), snapshot => {
  appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderAppointments(appointments);
});

//  Health Resources Logic
const resourcesTbody = document.getElementById("resourcesReportBody");
let resources = [];

async function loadResources() {
  const snapshot = await getDocs(collection(db, "healthResources"));
  resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderResources(resources);
}

function renderResources(data) {
  resourcesTbody.innerHTML = '';
  if (data.length === 0) {
    resourcesTbody.innerHTML = `<tr><td colspan="5">No resources found.</td></tr>`;
    return;
  }

  data.forEach(r => {
    const date = r.createdAt?.seconds
      ? new Date(r.createdAt.seconds * 1000).toLocaleDateString()
      : "N/A";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.title || ''}</td>
      <td>${r.category || ''}</td>
      <td>${r.externalLink || ''}</td>
      <td>${date}</td>
    `;
    resourcesTbody.appendChild(tr);
  });
}

loadResources();
onSnapshot(query(collection(db, "healthResources")), snapshot => {
  resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderResources(resources);
});

//  System Logs Logic
const logsTbody = document.getElementById("logsReportBody");
let logs = [];

async function loadLogs() {
  const snapshot = await getDocs(collection(db, "systemLogs"));
  logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderLogs(logs);
}

function renderLogs(data) {
  logsTbody.innerHTML = '';
  if (data.length === 0) {
    logsTbody.innerHTML = `<tr><td colspan="5">No logs found.</td></tr>`;
    return;
  }

  data.forEach(l => {
    const timestamp = l.timestamp?.seconds
      ? new Date(l.timestamp.seconds * 1000).toLocaleString()
      : "N/A";

    const tr = document.createElement("tr");
    let detailsHtml = '—';
    if (l.details && typeof l.details === 'object') {
      const entries = Object.entries(l.details);
      if (entries.length > 0) {
        detailsHtml = '<ul style="margin:0;padding-left:18px">' + entries.map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') + '</ul>';
      }
    } else if (l.details) {
      detailsHtml = l.details;
    }
    tr.innerHTML = `
      <td>${l.userName || 'Unknown'}</td>
      <td>${l.role || '—'}</td>
      <td>${l.action || '—'}</td>
      <td>${detailsHtml}</td>
      <td>${timestamp}</td>
    `;
    logsTbody.appendChild(tr);
  });
}

loadLogs();
onSnapshot(query(collection(db, "systemLogs")), snapshot => {
  logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderLogs(logs);
});

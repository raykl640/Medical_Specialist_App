import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load chart data
async function loadOverviewCharts() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startTimestamp = startOfMonth.getTime() / 1000;

  // Load Appointments
  const appointmentsSnap = await getDocs(
    query(collection(db, "appointments"))
  );
  const appointmentsData = {};
  appointmentsSnap.forEach(doc => {
    const data = doc.data();
    if (data.date?.seconds >= startTimestamp) {
      const day = new Date(data.date.seconds * 1000).getDate();
      appointmentsData[day] = (appointmentsData[day] || 0) + 1;
    }
  });

  const appointmentDays = Object.keys(appointmentsData).map(Number).sort((a, b) => a - b);
  const appointmentCounts = appointmentDays.map(day => appointmentsData[day]);

  // Load Patients
  const patientsSnap = await getDocs(collection(db, "patients"));
  const patientCounts = {};
  patientsSnap.forEach(doc => {
    const data = doc.data();
    const seconds = data.createdAt?.seconds;
    if (seconds && seconds >= startTimestamp) {
      const day = new Date(seconds * 1000).getDate();
      patientCounts[day] = (patientCounts[day] || 0) + 1;
    }
  });

  const patientDays = Object.keys(patientCounts).map(Number).sort((a, b) => a - b);
  const patientDayCounts = patientDays.map(day => patientCounts[day]);

  // Render Charts
  renderLineChart("appointmentsChart", "Appointments This Month", appointmentDays, appointmentCounts);
  renderLineChart("patientsChart", "New Patients This Month", patientDays, patientDayCounts);
}

function renderLineChart(canvasId, label, labels, data) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: "rgba(0, 119, 204, 0.1)",
        borderColor: "#0077cc",
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: {
          title: { display: true, text: "Day of Month" }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Count" }
        }
      },
      plugins: {
        legend: {
          display: true
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Initialize
loadOverviewCharts();

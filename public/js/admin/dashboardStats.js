// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

async function getTotalappointments() {
    try {
        const snapshot = await getDocs(collection(db, "appointments"));
        const total = snapshot.size;
        document.getElementById("apts-count").innerText = total;
    } catch (error) {
        console.error("Error fetching total appointments:", error);
    }
}

// Call the functions
getTotalPatients();
getTotalClincs();
getTotalappointments();


const ctx = document.getElementById('usageChart').getContext('2d');
  const usageChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Active Users',
        data: [5, 10, 8, 15, 12, 6, 9],
        fill: true,
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        borderColor: '#1E88E5',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Example usage
usageChart.data.datasets[0].data = [4, 7, 11, 6, 9, 10, 8];
usageChart.update();

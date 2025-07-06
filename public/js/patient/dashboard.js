import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    doc, getDoc,
    getDocs,
    getFirestore,
    query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBWkXxtI9514_YD6H4kQ6IgltPoSSf7W80",
  authDomain: "medical-specialist-app-d3a46.firebaseapp.com",
  projectId: "medical-specialist-app-d3a46",
  storageBucket: "medical-specialist-app-d3a46.appspot.com",
  messagingSenderId: "990201081362",
  appId: "1:990201081362:web:273dbe33edbbee6f2bb2cb",
  measurementId: "G-ECMD5067CE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function formatDateTime(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}
function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  const uid = user.uid;

  // 1. Fetch and display patient name
  try {
    const docRef = doc(db, "patients", uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      let fullName = data.fullName || ((data.firstName || "") + " " + (data.otherNames || "")).trim();
      document.getElementById("patientName").textContent = fullName || "-";
    }
  } catch (e) {
    document.getElementById("patientName").textContent = "-";
  }

  // 2. Fetch and display up to 4 health tips as resource cards
  try {
    const tipsGrid = document.getElementById("healthTipsGrid");
    if (tipsGrid) tipsGrid.innerHTML = "";
    const q = query(collection(db, "healthResources"));
    const snapshot = await getDocs(q);
    const tips = [];
    snapshot.forEach(doc => tips.push({ id: doc.id, ...doc.data() }));
    tips.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    const showTips = tips.slice(0, 4);
    showTips.forEach(tip => {
      const card = document.createElement("div");
      card.className = "resource-card";
      const imageUrl = tip.imageUrl || 'https://via.placeholder.com/400x200/4b6cb7/ffffff?text=Health+Resource';
      card.innerHTML = `
        <img src="${imageUrl}" alt="${tip.title || 'Resource'}" class="resource-image" onerror="this.src='https://via.placeholder.com/400x200/4b6cb7/ffffff?text=Health+Resource'">
        <div class="resource-content">
          <h3 class="resource-title">${tip.title || "Untitled"}</h3>
          <div class="resource-meta">
            <span class="resource-category">${tip.category || tip.type || "Resource"}</span>
            <span>${formatDate(tip.createdAt?.seconds ? tip.createdAt.seconds * 1000 : tip.createdAt)}</span>
          </div>
          <p class="resource-summary">${tip.summary || tip.description || "No description."}</p>
          <div class="resource-tags">
            ${(tip.tags || []).map(tag => `<span class='resource-tag'>${tag}</span>`).join('')}
          </div>
          <div class="resource-actions">
            <button class="btn-small btn-view" onclick="window.location.href='patientHealthResources.html?id=${tip.id}'">
              <i class="fas fa-eye"></i> View
            </button>
          </div>
        </div>
      `;
      tipsGrid.appendChild(card);
    });
    // Add View More button
    if (tips.length > 4) {
      const moreBtn = document.createElement("button");
      moreBtn.className = "btn-small btn-view";
      moreBtn.textContent = "View More";
      moreBtn.onclick = () => window.location.href = "patientHealthResources.html";
      tipsGrid.appendChild(moreBtn);
    }
  } catch (e) {
    // fallback: show nothing
  }

  // 3. Fetch and display the next upcoming appointment as an appointment card
  try {
    const apptCard = document.getElementById("upcomingAppointmentSection");
    if (apptCard) apptCard.innerHTML = "<h3>Upcoming Appointment</h3><div class='loading'>Loading...</div>";
    const q = query(collection(db, "appointments"), where("patientId", "==", uid));
    const snapshot = await getDocs(q);
    const now = new Date();
    let closest = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      let apptDate = data.date?.toDate?.() || (data.date ? new Date(data.date) : null);
      if (apptDate && apptDate > now) {
        if (!closest || apptDate < closest.date) {
          closest = { ...data, date: apptDate };
        }
      }
    });
    if (closest) {
      apptCard.innerHTML = `
        <h3>Upcoming Appointment</h3>
        <div class="appointment-card confirmed">
          <div class="appointment-header">
            <div class="appointment-info">
              <h3><i class="fas fa-user-md"></i> ${closest.specialistName || "Specialist Name"}</h3>
              <div class="specialty">🩺 ${closest.specialty || "Specialty"}</div>
            </div>
            <div class="appointment-status status-confirmed">
              Confirmed
            </div>
          </div>
          <div class="appointment-details">
            <div class="detail-item">
              <span><i class="fas fa-hospital"></i></span>
              <span><strong>Clinic:</strong> ${closest.clinicName || "Clinic Name"}</span>
            </div>
            <div class="detail-item">
              <span><i class="fas fa-calendar-alt"></i></span>
              <span><strong>Date:</strong> ${formatDate(closest.date)}</span>
            </div>
            <div class="detail-item">
              <span><i class="fas fa-clock"></i></span>
              <span><strong>Time:</strong> ${closest.time || "-"}</span>
            </div>
            <div class="detail-item">
              <span><i class="fas fa-map-marker-alt"></i></span>
              <span><strong>Location:</strong> ${closest.location || "Location"}</span>
            </div>
            <div class="detail-item">
              <span><i class="fas fa-file-alt"></i></span>
              <span><strong>Reason:</strong> ${closest.reason || "-"}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      apptCard.innerHTML = `<h3>Upcoming Appointment</h3><div class='appointment-card'><div>No upcoming appointments.</div></div>`;
    }
  } catch (e) {
    document.getElementById("upcomingAppointmentSection").innerHTML = `<h3>Upcoming Appointment</h3><div class='appointment-card'><div>Error loading appointment.</div></div>`;
  }
}); 
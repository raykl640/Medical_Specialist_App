import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// Simple in-app popup
function showInAppNotification(message) {
  const notification = document.createElement("div");
  notification.innerText = message;
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.backgroundColor = "#0077cc";
  notification.style.color = "#fff";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "8px";
  notification.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
  notification.style.zIndex = 9999;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Attach all listeners once user is authenticated
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  const userId = user.uid;

  // Appointments listener
  onSnapshot(
    query(collection(db, "appointments"), where("userId", "==", userId)),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (change.type === "added") {
          showInAppNotification("📅 Appointment booked");
        } else if (change.type === "modified") {
          showInAppNotification("🕒 Appointment rescheduled or updated");
        } else if (change.type === "removed") {
          showInAppNotification("❌ Appointment canceled");
        }
      });
    }
  );

  // Reusable function for new medical records
  const watchNewRecords = (collectionName, label) => {
    onSnapshot(
      query(collection(db, collectionName), where("patientId", "==", userId)),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            showInAppNotification(`📄 New ${label} record added`);
          }
        });
      }
    );
  };

  // Other medical records
  watchNewRecords("medicalHistory", "Medical History");
  watchNewRecords("labTests", "Lab Test");
  watchNewRecords("radiology", "Radiology");
  watchNewRecords("medications", "Medication");
});

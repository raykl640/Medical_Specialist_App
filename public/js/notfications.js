import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// Initialize services
const messaging = getMessaging(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(registration => {
      console.log("Service Worker registered:", registration);
    })
    .catch(error => {
      console.error("Service Worker registration failed:", error);
    });
}

// Save token function
async function saveTokenToFirestore(token) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("User not logged in, token not saved.");
    return;
  }

  try {
    await setDoc(doc(db, "fcmTokens", user.uid), {
      token,
      updatedAt: new Date()
    });
    console.log("FCM token saved to Firestore for user:", user.uid);
  } catch (error) {
    console.error("Error saving token to Firestore:", error);
  }
}

// Get FCM token
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is now available, safe to get token
    getToken(messaging, {
      vapidKey: "BKxb9EvRBamrw-_fkmMOR-mnTbiImXLiCBIc8aJMtOEf1TuT0PYeRGoljnFPHI7KF-pt0L0Xj5sJZaqf7lTFIMY"
    })
      .then((token) => {
        if (token) {
          console.log("FCM Token:", token);
          saveTokenToFirestore(token);
        } else {
          console.warn("⚠ No token. Request permission.");
        }
      })
      .catch(err => console.error("Error getting token:", err));
  } else {
    console.warn("⚠ User not logged in, token not saved.");
  }
});

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log("Message received in foreground:", payload);
  const { title, body } = payload.notification;
  if (typeof window.displayNotification === 'function') {
    window.displayNotification(title, body);
  } else {
    console.warn("Display function not yet available");
  }
  alert(payload.notification.title + "\n" + payload.notification.body);
});

function waitForNotificationElements() {
  const bell = document.getElementById("notificationBell");
  const count = document.getElementById("notificationCount");
  const dropdown = document.getElementById("notificationDropdown");
  const list = document.getElementById("notificationList");

  if (!bell || !count || !dropdown || !list) {
    return setTimeout(waitForNotificationElements, 200); // keep checking
  }

  let unread = 0;

  window.displayNotification = function(title, body) {
    unread++;
    count.textContent = unread;
    count.style.display = "inline-block";

    const li = document.createElement("li");
    li.classList.add("notification-item");
    li.innerHTML = `
      <strong>${title}</strong>
      <span>${body}</span>
    `;
    list.prepend(li);
  };

  bell.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
    if (!dropdown.classList.contains("hidden")) {
      unread = 0;
      count.textContent = "0";
      count.style.display = "none";
    }
  });

  console.log("🔔 Notification UI ready");
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(waitForNotificationElements, 300); // Wait for navigation injection
});

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
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
const auth = getAuth(app);
const db = getFirestore(app);

async function logSystemEvent({ action, details }) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("logSystemEvent: No authenticated user");
            return;
        }
        // Set role based on UID
        const adminUID = "mkDXWQzZzMd52KhaQ3r0aqthT8E2";
        const role = user.uid === adminUID ? "admin" : "patient";
        await addDoc(collection(db, "systemLogs"), {
            timestamp: serverTimestamp(),
            action,
            userId: user.uid,
            userName: user.displayName || user.email || "Unknown User",
            role,
            details
        });
        console.log(`System event logged: ${action, details}`);
    } catch (err) {
        console.error("logSystemEvent error:", err);
    }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const messageEl = document.getElementById("message");
    messageEl.textContent = "";

    if (!email || !password) {
        messageEl.textContent = "Please fill in both email and password.";
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            messageEl.textContent = "Please verify your email before logging in.";
            return;
        }

        messageEl.style.color = "green";
        messageEl.textContent = "Login successful! Redirecting...";
        await logSystemEvent({
            action: 'user login',
            details: {
                userId: user.uid,
                userName: user.displayName || user.email || "Unknown User"
            }
        });
        // Redirecting based on user identity
        const adminUID = "mkDXWQzZzMd52KhaQ3r0aqthT8E2";
        const adminEmail = "raylukorito@gmail.com";

        setTimeout(() => {
            if (user.uid === adminUID || user.email === adminEmail) {
                window.location.href = "adminIndex.html";
            } else {
                window.location.href = "patientDashboard.html";
            }
        }, 1500);

    } catch (error) {
        console.error("Login error:", error);
        messageEl.style.color = "red";
        messageEl.textContent = error.message;
    }
});

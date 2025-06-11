// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("registerBtn").addEventListener("click", async () => {
  const registerBtn = document.getElementById("registerBtn");

  registerBtn.disabled = true;
  registerBtn.textContent = "Registering...";

  const firstName = document.getElementById("firstName").value.trim();
  const otherNames = document.getElementById("otherNames").value.trim();
  const dob = document.getElementById("dob").value;
  const phone = "+254" + document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("homeAddress").value.trim();
  const gender = document.querySelector('input[name="sex"]:checked')?.value;

  const ecFirstName = document.getElementById("ecFirstName").value.trim();
  const ecOtherNames = document.getElementById("ecOtherNames").value.trim();
  const ecRelationship = document.getElementById("ecRelationship").value.trim();
  const ecPhone = "+254" + document.getElementById("ecPhone").value.trim();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  //validating email using emailRegex
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }


  // Validate
  if (!firstName || !dob || !phone || !email || !password || !confirmPassword) {
    alert("Please fill in all required fields.");
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
    return;
  }

  if(!isValidEmail(email)) {
    alert("Please enter a valid email address.");
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
    return;
  }

  try {
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);
    alert("Registration successful! A verification email has been sent.");

    // Save extra data to Firestore
    await setDoc(doc(db, "patients", user.uid), {
      firstName,
      otherNames,
      dob,
      phone,
      email,
      address,
      gender,
      emergencyContact: {
        firstName: ecFirstName,
        otherNames: ecOtherNames,
        relationship: ecRelationship,
        phone: ecPhone,
      },
      createdAt: new Date().toISOString(),
    });

    window.location.href = "login.html";

  } catch (error) {
    console.error("Registration error:", error);
    alert(error.message);
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  }
});

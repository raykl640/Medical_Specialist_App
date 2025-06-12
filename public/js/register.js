import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getFirestore, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  if (!firstName || !dob || !phone || !email || !password || !confirmPassword) {
    alert("Please fill in all required fields.");
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
    return;
  }

  if (!isValidEmail(email)) {
    alert("Please enter a valid email address.");
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await sendEmailVerification(user);
    alert("Registration successful! A verification email has been sent.");

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

    window.location.href = "public/login.html";

  } catch (error) {
    let friendlyMessage = "";

    if (error.code === "auth/email-already-in-use") {
      friendlyMessage = "This email is already registered. Try logging in instead.";
    } else if (error.code === "auth/invalid-email") {
      friendlyMessage = "Please enter a valid email address.";
    } else if (error.code === "auth/password-does-not-meet-requirements") {
      friendlyMessage = "Your password must be at least 6 characters long, and include an uppercase letter, a number, and a special character.";
    } else {
      friendlyMessage = error.message;
    }

    alert(friendlyMessage);
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  }
});

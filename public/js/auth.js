// js/auth.js
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth, db } from '../firebase-config.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.router = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            this.updateUI();

            if (user) {
                console.log('User logged in:', user.email);
                const currentPath = window.location.hash.slice(1);
                if (currentPath === 'login' || currentPath === 'register') {
                    if (this.router) this.router.navigateTo('dashboard');
                }

                await this.loadUserData(user);
            } else {
                console.log('User logged out');
                const currentPath = window.location.hash.slice(1);
                if (currentPath === 'dashboard') {
                    if (this.router) this.router.navigateTo('login');
                }
            }
        });

        this.setupFormHandlers();
    }

    setRouter(router) {
        this.router = router;
    }

    setupFormHandlers() {
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'login-form') {
                e.preventDefault();
                await this.handleLogin(e.target);
            } else if (e.target.id === 'register-form') {
                e.preventDefault();
                await this.handleRegister(e.target);
            } else if (e.target.id === 'contact-form') {
                e.preventDefault();
                await this.handleContact(e.target);
            }
        });
    }

    async handleLogin(form) {
        const email = form.querySelector('#login-email').value;
        const password = form.querySelector('#login-password').value;

        try {
            this.showLoading(true);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful:', userCredential.user.email);
            this.showMessage('Login successful!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(form) {
        const name = form.querySelector('#register-name').value;
        const email = form.querySelector('#register-email').value;
        const password = form.querySelector('#register-password').value;
        const confirmPassword = form.querySelector('#register-confirm-password').value;

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });

            await setDoc(doc(db, 'users', user.uid), {
                name,
                email,
                createdAt: new Date().toISOString(),
                role: 'patient'
            });

            console.log('Registration successful:', user.email);
            this.showMessage('Registration successful!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleContact(form) {
        const name = form.querySelector('#name').value;
        const email = form.querySelector('#email').value;
        const subject = form.querySelector('#subject').value;
        const message = form.querySelector('#message').value;

        try {
            this.showLoading(true);
            console.log('Contact form submitted:', { name, email, subject, message });
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showMessage('Message sent successfully! We\'ll get back to you soon.', 'success');
            form.reset();
        } catch (error) {
            console.error('Contact form error:', error);
            this.showMessage('Failed to send message. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadUserData(user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            if (window.navManager) {
                window.navManager.setPatientName(userData.name || 'Patient');
                const notificationsCount = await this.getNotificationsCount(user.uid);
                window.navManager.setNotificationCount(notificationsCount);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async getNotificationsCount(userId) {
        try {
            const snapshot = await db.collection('notifications')
                .where('userId', '==', userId)
                .where('read', '==', false)
                .get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting notifications count:', error);
            return 0;
        }
    }

    showLoading(isLoading) {
        // Implement loader display logic here
    }

    showMessage(message, type) {
        // Implement message display logic here
    }

    getErrorMessage(code) {
        const errors = {
            'auth/user-not-found': 'No user found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'Email is already in use.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/weak-password': 'Password is too weak.'
        };
        return errors[code] || 'An error occurred. Please try again.';
    }

    updateUI() {
        // Optional: logic to update UI on auth change
    }
}

export default AuthManager;

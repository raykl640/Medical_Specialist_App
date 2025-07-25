import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getFirestore,
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase config - Replace with your actual config
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

// Utility functions
const utils = {
    escapeHtml: (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showMessage: (message, type = 'info') => {
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error' : 'success';
        messageDiv.textContent = message;

        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    },

    setLoading: (isLoading, element = document.getElementById('clinicsList')) => {
        if (isLoading && element) {
            element.innerHTML = '<div class="loading">Loading...</div>';
        }
    }
};
async function logSystemEvent({ action, details }) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('logSystemEvent: No authenticated user');
            return;
        }
        await addDoc(collection(db, "systemLogs"), {
            timestamp: serverTimestamp(),
            action,
            userId: user.uid,
            userName: user.displayName || user.email || "Unknown",
            role: "admin", // Default to admin for clinic actions
            details
        });
        console.log('System event logged:', action, details);
    } catch (err) {
        console.error('logSystemEvent error:', err);
    }
}

// Firebase Firestore operations
const clinicService = {
    async addClinic(clinicData) {
        try {
            // Generate clinic_Id
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2, 8);
            const clinic_Id = `CLINIC_${timestamp}_${randomStr}`.toUpperCase();

            const docRef = await addDoc(collection(db, 'clinics'), {
                ...clinicData,
                clinic_Id: clinic_Id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            console.log('✅ Clinic added with ID:', docRef.id, 'clinic_Id:', clinic_Id);
            // System event logging for clinics
            await logSystemEvent({
                action: 'clinic added',
                details: {
                    clinicName: clinicData.clinicName,
                    location: clinicData.location,
                    clinic_Id
                }
            });
            return { success: true, id: docRef.id, clinic_Id: clinic_Id };
        } catch (error) {
            console.error('❌ Error adding clinic:', error);
            throw new Error(`Failed to add clinic: ${error.message}`);
        }
    },

    async getClinics() {
        try {
            const q = query(
                collection(db, 'clinics'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const clinics = [];

            querySnapshot.forEach((doc) => {
                clinics.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('✅ Fetched clinics:', clinics.length);
            return { success: true, clinics };
        } catch (error) {
            console.error('❌ Error getting clinics:', error);
            throw new Error(`Failed to get clinics: ${error.message}`);
        }
    },

    async updateClinic(clinicId, clinicData) {
        try {
            const clinicRef = doc(db, 'clinics', clinicId);
            await updateDoc(clinicRef, {
                ...clinicData,
                updatedAt: serverTimestamp()
            });

            console.log('✅ Clinic updated:', clinicId);
            // System event logging for clinic update
            await logSystemEvent({
                action: 'clinic updated',
                details: {
                    clinicId,
                    ...clinicData
                }
            });
            return { success: true };
        } catch (error) {
            console.error('❌ Error updating clinic:', error);
            throw new Error(`Failed to update clinic: ${error.message}`);
        }
    },

    async deleteClinic(clinicId) {
        try {
            const clinicRef = doc(db, 'clinics', clinicId);
            await deleteDoc(clinicRef);

            console.log('✅ Clinic deleted:', clinicId);
            // System event logging for clinic deletion
            await logSystemEvent({
                action: 'clinic deleted',
                details: { clinicId }
            });
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting clinic:', error);
            throw new Error(`Failed to delete clinic: ${error.message}`);
        }
    }
};

// UI Management
const ui = {
    displayClinics(clinics) {
        const clinicsList = document.getElementById('clinicsList');

        if (!clinics || clinics.length === 0) {
            clinicsList.innerHTML = '<div class="loading">No clinics found. Add your first clinic above! 🏥</div>';
            return;
        }

        clinicsList.innerHTML = clinics.map(clinic => {
            const clinicName = utils.escapeHtml(clinic.clinicName || clinic.name);
            const location = utils.escapeHtml(clinic.location);
            const clinicId = clinic.id || clinic.clinicId;
            const clinic_Id = clinic.clinic_Id || 'N/A';

            // Properly escape quotes for onclick attributes
            const escapedNameForJs = (clinic.clinicName || clinic.name || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
            const escapedLocationForJs = (clinic.location || '').replace(/'/g, "\\'").replace(/"/g, '\\"');

            return `
      <div class="clinic-card">
        <h3>🏥 ${clinicName}</h3>
        <p>🆔 <strong>Clinic ID:</strong> ${clinic_Id}</p>
        <p>📍 <strong>Location:</strong> ${location}</p>
        <p>🕒 <strong>Created:</strong> ${clinic.createdAt && clinic.createdAt.seconds ? new Date(clinic.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
        <div class="clinic-actions">
          <button class="edit-btn" onclick="editClinic('${clinicId}', '${escapedNameForJs}', '${escapedLocationForJs}')">
            ✏️ Edit
          </button>
          <button class="delete-btn" onclick="removeClinic('${clinicId}')">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
        }).join('');
    },

    updateUserInfo(user) {
        const userInfo = document.getElementById('userInfo');
        const userEmail = document.getElementById('userEmail');

        if (user && userInfo && userEmail) {
            userEmail.textContent = user.email;
            userInfo.style.display = 'block';
        } else if (userInfo) {
            userInfo.style.display = 'none';
        }
    }
};

// Main Clinic Manager
class ClinicManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAuthListener();
        console.log('🏥 Clinic Manager initialized');
    }

    setupEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindFormEvents();
            });
        } else {
            this.bindFormEvents();
        }
    }

    bindFormEvents() {
        const clinicForm = document.getElementById('clinicForm');
        if (clinicForm) {
            clinicForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    setupAuthListener() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            ui.updateUserInfo(user);

            if (user) {
                console.log('👤 User authenticated:', user.email);
                this.loadClinics();
            } else {
                console.log('❌ User not authenticated');
                // Redirect to login if not on login page
                if (!window.location.pathname.includes('login')) {
                    window.location.href = '/public/login.html';
                }
            }
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const clinicName = document.getElementById('clinicName').value.trim();
        const location = document.getElementById('location').value.trim();

        if (!clinicName || !location) {
            utils.showMessage('Please fill in all fields.', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;

        try {
            await clinicService.addClinic({
                clinicName,
                location
            });

            utils.showMessage('Clinic added successfully! 🎉', 'success');
            document.getElementById('clinicForm').reset();
            await this.loadClinics();
        } catch (error) {
            console.error('Form submission error:', error);
            utils.showMessage(error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async loadClinics() {
        utils.setLoading(true);

        try {
            const result = await clinicService.getClinics();
            if (result && result.success) {
                ui.displayClinics(result.clinics);
            } else {
                throw new Error('Failed to load clinics');
            }
        } catch (error) {
            console.error('Error loading clinics:', error);
            const clinicsList = document.getElementById('clinicsList');
            if (clinicsList) {
                clinicsList.innerHTML =
                    '<div class="error">Error loading clinics. Please refresh the page. 🔄</div>';
            }
        }
    }

    async editClinic(clinicId, currentName, currentLocation) {
        const newName = prompt('Enter clinic name:', currentName);
        if (newName === null) return;

        const newLocation = prompt('Enter location:', currentLocation);
        if (newLocation === null) return;

        if (!newName.trim() || !newLocation.trim()) {
            utils.showMessage('Please enter both clinic name and location.', 'error');
            return;
        }

        try {
            await clinicService.updateClinic(clinicId, {
                clinicName: newName.trim(),
                location: newLocation.trim()
            });

            utils.showMessage('Clinic updated successfully! ✅', 'success');
            await this.loadClinics();
        } catch (error) {
            console.error('Update error:', error);
            utils.showMessage(error.message, 'error');
        }
    }

    async removeClinic(clinicId) {
        if (!confirm('Are you sure you want to delete this clinic? This action cannot be undone.')) {
            return;
        }

        try {
            await clinicService.deleteClinic(clinicId);
            utils.showMessage('Clinic deleted successfully! 🗑️', 'success');
            await this.loadClinics();
        } catch (error) {
            console.error('Delete error:', error);
            utils.showMessage(error.message, 'error');
        }
    }


}

// Initialize the clinic manager
const clinicManager = new ClinicManager();

// Global functions for HTML onclick events
window.logout = () => {
    clinicManager.logout();
};

window.editClinic = (clinicId, currentName, currentLocation) => {
    clinicManager.editClinic(clinicId, currentName, currentLocation);
};

window.removeClinic = (clinicId) => {
    clinicManager.removeClinic(clinicId);
};

console.log('Clinic management system ready!');
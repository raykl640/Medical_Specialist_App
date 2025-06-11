// clinics.js
import { signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth, db } from '../firebase-config.js';

// Configuration
const CONFIG = {
  isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  functionsUrl: window.location.hostname === 'localhost' 
    ? 'http://localhost:5001/medical-specialist-app-d3a46/us-central1'
    : 'https://us-central1-medical-specialist-app-d3a46.cloudfunctions.net',
  collections: {
    clinics: 'clinics'
  }
};

// Utility functions
const utils = {
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  },
  
  showMessage: (message, type = 'info') => {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error' : 'success';
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  },
  
  setLoading: (isLoading, element = document.getElementById('clinicsList')) => {
    if (isLoading) {
      element.innerHTML = '<div class="loading">Loading...</div>';
    }
  }
};

// Firebase Firestore operations (Direct DB access)
const clinicService = {
  // Add clinic directly to Firestore
 async addClinic(clinicData) {
  try {
    // Generate clinic_Id
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const clinic_Id = `CLINIC_${timestamp}_${randomStr}`.toUpperCase();
    
    const docRef = await addDoc(collection(db, CONFIG.collections.clinics), {
      ...clinicData,
      clinic_Id: clinic_Id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Clinic added with ID:', docRef.id, 'clinic_Id:', clinic_Id);
    return { success: true, id: docRef.id, clinic_Id: clinic_Id };
  } catch (error) {
    console.error('❌ Error adding clinic:', error);
    throw new Error(`Failed to add clinic: ${error.message}`);
  }
},

  // Get all clinics from Firestore
  async getClinics() {
    try {
      const q = query(
        collection(db, CONFIG.collections.clinics), 
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

  // Update clinic in Firestore
  async updateClinic(clinicId, clinicData) {
    try {
      const clinicRef = doc(db, CONFIG.collections.clinics, clinicId);
      await updateDoc(clinicRef, {
        ...clinicData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Clinic updated:', clinicId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating clinic:', error);
      throw new Error(`Failed to update clinic: ${error.message}`);
    }
  },

  // Delete clinic from Firestore
  async deleteClinic(clinicId) {
    try {
      const clinicRef = doc(db, CONFIG.collections.clinics, clinicId);
      await deleteDoc(clinicRef);
      
      console.log('✅ Clinic deleted:', clinicId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting clinic:', error);
      throw new Error(`Failed to delete clinic: ${error.message}`);
    }
  }
};

// Cloud Functions operations (Alternative/Backup)
const functionsService = {
  async getAuthToken() {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  },

  async callFunction(functionName, data = null, method = 'GET') {
    const token = await this.getAuthToken();
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${CONFIG.functionsUrl}/${functionName}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
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
    const escapedName = utils.escapeHtml(clinic.clinicName || clinic.name);
    const escapedLocation = utils.escapeHtml(clinic.location);
    const clinicId = clinic.id || clinic.clinicId;
    const clinic_Id = clinic.clinic_Id || 'N/A';
    
    return `
      <div class="clinic-card">
        <h3>🏥 ${escapedName}</h3>
        <p>🆔 <strong>Clinic ID:</strong> ${clinic_Id}</p>
        <p>📍 <strong>Location:</strong> ${escapedLocation}</p>
        <p>🕒 <strong>Created:</strong> ${clinic.createdAt ? new Date(clinic.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
        <div class="clinic-actions">
          <button class="edit-btn" onclick="window.clinicManager.editClinic('${clinicId}', '${escapedName.replace(/'/g, '\\\')}', '${escapedLocation.replace(/'/g, '\\\'')}')">
            ✏️ Edit
          </button>
          <button class="delete-btn" onclick="window.clinicManager.removeClinic('${clinicId}')">
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
    
    if (user) {
      userEmail.textContent = user.email;
      userInfo.style.display = 'block';
    } else {
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
    // Form submission
    document.addEventListener('DOMContentLoaded', () => {
      const clinicForm = document.getElementById('clinicForm');
      if (clinicForm) {
        clinicForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
      }
    });
  }

  setupAuthListener() {
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      ui.updateUserInfo(user);
      
      if (user) {
        console.log('👤 User authenticated:', user.email);
        this.loadClinics();
      } else {
        console.log('❌ User not authenticated');
        if (window.location.pathname !== '/login.html') {
          window.location.href = 'login.html';
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
      document.getElementById('clinicsList').innerHTML = 
        '<div class="error">Error loading clinics. Please refresh the page. 🔄</div>';
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

  async logout() {
    try {
      await signOut(auth);
      utils.showMessage('Logged out successfully! 👋', 'success');
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      utils.showMessage('Error logging out. Please try again.', 'error');
    }
  }
}

// Global functions for HTML onclick events
window.logout = () => {
  window.clinicManager.logout();
};

// Initialize the clinic manager
window.clinicManager = new ClinicManager();

console.log('🚀 Clinic management system ready!');
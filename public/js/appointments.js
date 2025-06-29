// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    getFirestore,
    query,
    Timestamp,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

// Global variables
let currentUser = null;
let allClinics = [];
let allSpecialists = [];
let userAppointments = [];
let selectedTimeSlot = null;
let selectedRescheduleTimeSlot = null;
let currentAppointmentToReschedule = null;
let bookedTimeSlots = new Map(); // Key: "specialistId_date_time", Value: appointmentId

// Utility functions
const utils = {
    formatDate: (timestamp) => {
        if (!timestamp) return 'N/A';
        let date;
        if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatTime: (timestamp) => {
        if (!timestamp) return 'N/A';
        let date;
        if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    showMessage: (message, type = 'success') => {
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        const firstSection = document.querySelector('.section');
        firstSection.insertBefore(messageDiv, firstSection.firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    },

    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // New utility to parse time strings (e.g., "03:00 PM")
    parseTime: (timeString) => {
        if (!timeString) return { hours: 0, minutes: 0 };
        const [time, ampm] = timeString.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (ampm && ampm.toLowerCase() === 'pm' && hours < 12) {
            hours += 12;
        } else if (ampm && ampm.toLowerCase() === 'am' && hours === 12) {
            hours = 0; // 12 AM is 00 hours
        }
        return { hours, minutes };
    }
};

// Data service functions
const dataService = {
    async getClinics() {
        try {
            const querySnapshot = await getDocs(collection(db, 'clinics'));
            const clinics = [];
            querySnapshot.forEach((doc) => {
                clinics.push({ id: doc.id, ...doc.data() });
            });
            return clinics;
        } catch (error) {
            console.error('Error getting clinics:', error);
            return [];
        }
    },

    async getSpecialists() {
        try {
            const querySnapshot = await getDocs(collection(db, 'specialists'));
            const specialists = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                specialists.push({
                    id: doc.id,
                    specialistId: data.specialistId || doc.id,
                    name: (data.name || data[' name'] || '').trim(),
                    specialty: data.specialty || 'General Practice',
                    clinicId: data.clinicId || data.clinic_Id || data.clinic_id,
                    availability: data.availability || [],
                    ...data
                });
            });
            return specialists;
        } catch (error) {
            console.error('Error getting specialists:', error);
            return [];
        }
    },

    async getUserAppointments(userId) {
        try {
            console.log('🔍 Fetching appointments for user:', userId);
            const appointmentsRef = collection(db, 'appointments');
            const q = query(
                appointmentsRef,
                where('patientId', '==', userId)
            );
            
            const querySnapshot = await getDocs(q);
            const appointments = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log('📝 Appointment document:', { id: doc.id, data });
                
                // Convert Firestore timestamps to Date objects
                const appointment = {
                    id: doc.id,
                    ...data,
                    date: data.date?.toDate?.() || new Date(data.date),
                    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
                };
                
                console.log('🔄 Processed appointment:', appointment);
                appointments.push(appointment);
            });
            
            // Sort appointments by date in memory
            appointments.sort((a, b) => b.date - a.date);
            
            console.log('✅ Fetched appointments:', appointments.length, appointments);
            return appointments;
        } catch (error) {
            console.error('❌ Error getting appointments:', error);
            return [];
        }
    },

    async bookAppointment(appointmentData) {
        try {
            // Check for double booking before creating appointment
            const dateStr = appointmentData.date.toISOString().split('T')[0];
            const slotKey = `${appointmentData.specialistId}_${dateStr}_${appointmentData.time}`;
            
            if (bookedTimeSlots.has(slotKey)) {
                throw new Error('This time slot is already booked. Please select another time.');
            }
            
            const appointmentsRef = collection(db, 'appointments');
            
            // Create the appointment document
            const appointment = {
                ...appointmentData,
                patientId: currentUser.uid,
                patientEmail: currentUser.email,
                status: 'confirmed',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            
            // Add to Firestore
            const docRef = await addDoc(appointmentsRef, appointment);
            
            // Update local booked slots map
            bookedTimeSlots.set(slotKey, docRef.id);
            
            // Update local state
            const newAppointment = {
                id: docRef.id,
                ...appointment,
                date: appointment.date,
                createdAt: appointment.createdAt.toDate(),
                updatedAt: appointment.updatedAt.toDate()
            };
            
            userAppointments.unshift(newAppointment);
            return newAppointment;
        } catch (error) {
            console.error('Error booking appointment:', error);
            throw error;
        }
    },

    async rescheduleAppointment(appointmentId, newDate, newTime, reason) {
        try {
            const appointmentRef = doc(db, 'appointments', appointmentId);
            
            // Update in Firestore
            await updateDoc(appointmentRef, {
                date: Timestamp.fromDate(newDate),
                time: newTime,
                rescheduleReason: reason,
                updatedAt: Timestamp.now()
            });
            
            // Update local state
            const appointmentIndex = userAppointments.findIndex(apt => apt.id === appointmentId);
            if (appointmentIndex !== -1) {
                userAppointments[appointmentIndex] = {
                    ...userAppointments[appointmentIndex],
                    date: newDate,
                    time: newTime,
                    rescheduleReason: reason,
                    updatedAt: new Date()
                };
            }
            
            return userAppointments[appointmentIndex];
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            throw error;
        }
    },

    async cancelAppointment(appointmentId) {
        try {
            const appointmentRef = doc(db, 'appointments', appointmentId);
            
            // Update in Firestore
            await updateDoc(appointmentRef, {
                status: 'cancelled',
                updatedAt: Timestamp.now()
            });
            
            // Update local state
            const appointmentIndex = userAppointments.findIndex(apt => apt.id === appointmentId);
            if (appointmentIndex !== -1) {
                userAppointments[appointmentIndex].status = 'cancelled';
                userAppointments[appointmentIndex].updatedAt = new Date();
            }
            
            return true;
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            throw error;
        }
    },

    async updateAppointmentStatus(appointmentId, newStatus) {
        try {
            const appointmentRef = doc(db, 'appointments', appointmentId);
            await updateDoc(appointmentRef, {
                status: newStatus,
                updatedAt: Timestamp.now()
            });
            console.log(`Appointment ${appointmentId} status updated to ${newStatus}`);
            return true;
        } catch (error) {
            console.error(`Error updating appointment ${appointmentId} status to ${newStatus}:`, error);
            throw error;
        }
    },

    async checkAndUpdateAppointmentStatuses() {
        console.log('Checking for past confirmed appointments to update status...');
        const now = new Date();
        console.log('Current Date/Time (Now):', now.toLocaleString());

        const updates = userAppointments.map(async (apt) => {
            // Only process if status is confirmed
            if (apt.status !== 'confirmed') {
                return;
            }
            
            // Combine date and time into a single Date object for accurate comparison
            const datePart = apt.date.toISOString().split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            
            const { hours, minutes } = utils.parseTime(apt.time);

            const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

            console.log('Comparing:', {
                appointmentId: apt.id,
                appointmentDateTime: appointmentDateTime.toLocaleString(),
                now: now.toLocaleString(),
                isPast: appointmentDateTime < now,
                status: apt.status
            });

            if (appointmentDateTime < now) {
                console.log(`Appointment ${apt.id} is past due and confirmed. Updating to completed.`);
                try {
                    await dataService.updateAppointmentStatus(apt.id, 'completed');
                    apt.status = 'completed'; // Update local state immediately
                    apt.updatedAt = new Date(); // Update local timestamp
                } catch (error) {
                    console.error(`Failed to update status for appointment ${apt.id}:`, error);
                }
            }
        });
        await Promise.all(updates);
        console.log('Finished checking and updating appointment statuses.');
    },

    getAllBookedSlots: async function() {
        try {
            const appointmentsRef = collection(db, 'appointments');
            const q = query(
                appointmentsRef,
                where('status', 'in', ['confirmed', 'upcoming'])
            );
            
            const querySnapshot = await getDocs(q);
            const bookedSlots = new Map();
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const date = data.date?.toDate?.() || new Date(data.date);
                const dateStr = date.toISOString().split('T')[0];
                const key = `${data.specialistId}_${dateStr}_${data.time}`;
                bookedSlots.set(key, doc.id);
            });
            
            console.log('📅 Loaded booked slots:', bookedSlots);
            return bookedSlots;
        } catch (error) {
            console.error('Error getting booked slots:', error);
            return new Map();
        }
    }
};

// UI functions
const ui = {
    async loadAppointments() {
        if (!currentUser) return;

        try {
            // Load booked slots first
            bookedTimeSlots = await dataService.getAllBookedSlots();
            userAppointments = await dataService.getUserAppointments(currentUser.uid);
            await this.checkAndUpdateAppointmentStatuses();
            this.renderAppointments();
        } catch (error) {
            console.error('Error loading appointments:', error);
            utils.showMessage('Failed to load appointments', 'error');
        }
    },

    async checkAndUpdateAppointmentStatuses() {
        console.log('Checking for past confirmed appointments to update status...');
        const now = new Date();
        console.log('Current Date/Time (Now):', now.toLocaleString());

        const updates = userAppointments.map(async (apt) => {
            // Only process if status is confirmed
            if (apt.status !== 'confirmed') {
                return;
            }
            
            // Combine date and time into a single Date object for accurate comparison
            const datePart = apt.date.toISOString().split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            
            const { hours, minutes } = utils.parseTime(apt.time);

            const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

            console.log('Comparing:', {
                appointmentId: apt.id,
                appointmentDateTime: appointmentDateTime.toLocaleString(),
                now: now.toLocaleString(),
                isPast: appointmentDateTime < now,
                status: apt.status
            });

            if (appointmentDateTime < now) {
                console.log(`Appointment ${apt.id} is past due and confirmed. Updating to completed.`);
                try {
                    await dataService.updateAppointmentStatus(apt.id, 'completed');
                    apt.status = 'completed'; // Update local state immediately
                    apt.updatedAt = new Date(); // Update local timestamp
                } catch (error) {
                    console.error(`Failed to update status for appointment ${apt.id}:`, error);
                }
            }
        });
        await Promise.all(updates);
        console.log('Finished checking and updating appointment statuses.');
    },

    renderAppointments() {
        console.log('🎨 Rendering appointments:', userAppointments);
        const now = new Date();
        
        const upcomingAppointments = userAppointments.filter(apt => {
            const appointmentDate = new Date(apt.date);
            console.log('📅 Comparing dates:', {
                appointmentDate,
                now,
                isUpcoming: appointmentDate >= now,
                status: apt.status
            });
            return appointmentDate >= now && apt.status !== 'cancelled';
        });
        
        const pastAppointments = userAppointments.filter(apt => {
            const appointmentDate = new Date(apt.date);
            return appointmentDate < now || apt.status === 'cancelled';
        });

        console.log('📊 Filtered appointments:', {
            upcoming: upcomingAppointments.length,
            past: pastAppointments.length
        });

        this.renderAppointmentSection('upcomingAppointments', upcomingAppointments, 'upcoming');
        this.renderAppointmentSection('pastAppointments', pastAppointments, 'past');
    },

    renderAppointmentSection(containerId, appointments, type) {
        console.log(`🎨 Rendering ${type} appointments:`, appointments);
        const container = document.getElementById(containerId);
        
        if (!appointments || appointments.length === 0) {
            container.innerHTML = `
                <div class="no-appointments">
                    <h3>📅 No ${type} appointments</h3>
                    <p>${type === 'upcoming' ? 
                        'You have no upcoming appointments. Book one using the button above!' : 
                        'No appointment history available.'
                    }</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        appointments.forEach(appointment => {
            console.log('🎯 Rendering appointment:', appointment);
            const appointmentCard = document.createElement('div');
            appointmentCard.className = `appointment-card ${appointment.status}`;
            
            appointmentCard.innerHTML = `
                <div class="appointment-header">
                    <div class="appointment-info">
                        <h3>👨‍⚕️ ${appointment.specialistName}</h3>
                        <div class="specialty">🩺 ${appointment.specialty}</div>
                    </div>
                    <div class="appointment-status status-${appointment.status}">
                        ${appointment.status}
                    </div>
                </div>
                
                <div class="appointment-details">
                    <div class="detail-item">
                        <span>🏥</span>
                        <span><strong>Clinic:</strong> ${appointment.clinicName}</span>
                    </div>
                    <div class="detail-item">
                        <span>📅</span>
                        <span><strong>Date:</strong> ${utils.formatDate(appointment.date)}</span>
                    </div>
                    <div class="detail-item">
                        <span>🕒</span>
                        <span><strong>Time:</strong> ${appointment.time}</span>
                    </div>
                    <div class="detail-item">
                        <span>📍</span>
                        <span><strong>Location:</strong> ${appointment.location}</span>
                    </div>
                    <div class="detail-item">
                        <span>📝</span>
                        <span><strong>Reason:</strong> ${appointment.reason}</span>
                    </div>
                </div>
                
                <div class="appointment-actions">
                    ${type === 'upcoming' && appointment.status !== 'cancelled' ? `
                        <button class="action-btn reschedule-btn" onclick="showRescheduleModal('${appointment.id}')">
                            📅 Reschedule
                        </button>
                        <button class="action-btn cancel-btn" onclick="cancelAppointment('${appointment.id}')">
                            ❌ Cancel
                        </button>
                    ` : ''}
                    <button class="action-btn view-btn" onclick="viewAppointmentDetails('${appointment.id}')">
                        👁️ View Details
                    </button>
                </div>
            `;
            
            container.appendChild(appointmentCard);
        });
    },

    async setupBookingModal(selectedSpecialist = null) {
        // Load clinics and specialists
        allClinics = await dataService.getClinics();
        allSpecialists = await dataService.getSpecialists();

        // Populate clinic dropdown
        const clinicSelect = document.getElementById('clinicSelect');
        clinicSelect.innerHTML = '<option value="">Choose a clinic...</option>';
        
        allClinics.forEach(clinic => {
            const option = document.createElement('option');
            option.value = clinic.id;
            option.textContent = `${clinic.clinicName || clinic.name} - ${clinic.location}`;
            clinicSelect.appendChild(option);
        });

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDate').min = today;
        document.getElementById('newAppointmentDate').min = today;

        // If a specialist was selected, pre-select their clinic and specialist
        if (selectedSpecialist) {
            const specialist = allSpecialists.find(s => s.id === selectedSpecialist.id);
            if (specialist) {
                const clinicId = specialist.clinicId || specialist.clinic_Id || specialist.clinic_id;
                if (clinicId) {
                    clinicSelect.value = clinicId;
                    // Trigger clinic change to populate specialists
                    this.handleClinicChange({ target: clinicSelect });
                    // Select the specialist
                    const specialistSelect = document.getElementById('specialistSelect');
                    specialistSelect.value = selectedSpecialist.id;
                }
            }
        }

        // Add event listeners
        clinicSelect.addEventListener('change', this.handleClinicChange.bind(this));
        document.getElementById('appointmentDate').addEventListener('change', this.handleDateChange.bind(this));
        document.getElementById('newAppointmentDate').addEventListener('change', this.handleRescheduleDateChange.bind(this));
        document.getElementById('bookingForm').addEventListener('submit', this.handleBookingSubmit.bind(this));
        document.getElementById('rescheduleForm').addEventListener('submit', this.handleRescheduleSubmit.bind(this));
    },

    handleClinicChange(event) {
        const clinicId = event.target.value;
        const specialistSelect = document.getElementById('specialistSelect');
        
        // Reset specialist dropdown
        specialistSelect.innerHTML = '<option value="">Select a specialist...</option>';
        specialistSelect.disabled = !clinicId;
        
        if (clinicId) {
            // Filter specialists for selected clinic
            const clinicSpecialists = allSpecialists.filter(specialist => 
                (specialist.clinicId || specialist.clinic_Id || specialist.clinic_id || '').trim() === clinicId
            );
            
            clinicSpecialists.forEach(specialist => {
                const option = document.createElement('option');
                option.value = specialist.id;
                option.textContent = `${specialist.name} - ${specialist.specialty}`;
                specialistSelect.appendChild(option);
            });
        }
    },

    handleDateChange(event) {
        const date = event.target.value;
        const timeSlots = document.getElementById('timeSlots');
        
        if (!date) {
            timeSlots.innerHTML = '<div class="time-slot unavailable">Select date first</div>';
            return;
        }

        // Get selected specialist
        const specialistId = document.getElementById('specialistSelect').value;
        const specialist = allSpecialists.find(s => s.id === specialistId);
        
        if (!specialist) {
            timeSlots.innerHTML = '<div class="time-slot unavailable">Select specialist first</div>';
            return;
        }

        // Render available time slots
        this.renderTimeSlots(specialist.availability, timeSlots, 'booking');
    },

    handleRescheduleDateChange(event) {
        const date = event.target.value;
        const timeSlots = document.getElementById('rescheduleTimeSlots');
        
        if (!date) {
            timeSlots.innerHTML = '<div class="time-slot unavailable">Select date first</div>';
            return;
        }

        if (!currentAppointmentToReschedule) {
            timeSlots.innerHTML = '<div class="time-slot unavailable">No appointment selected</div>';
            return;
        }

        // Get specialist
        const specialist = allSpecialists.find(s => s.id === currentAppointmentToReschedule.specialistId);
        
        if (!specialist) {
            timeSlots.innerHTML = '<div class="time-slot unavailable">Specialist not found</div>';
            return;
        }

        // Render available time slots
        this.renderTimeSlots(specialist.availability, timeSlots, 'reschedule');
    },

    renderTimeSlots(availability, container, type) {
        if (!availability || !Array.isArray(availability) || availability.length === 0) {
            container.innerHTML = '<div class="time-slot unavailable">No time slots available</div>';
            return;
        }

        // Get selected date and specialist
        const dateInput = type === 'booking' ? 
            document.getElementById('appointmentDate') : 
            document.getElementById('newAppointmentDate');
        const selectedDate = dateInput.value;
        let specialistId;
        if (type === 'booking') {
            specialistId = document.getElementById('specialistSelect').value;
        } else {
            specialistId = currentAppointmentToReschedule?.specialistId;
        }
        container.innerHTML = '';
        availability.forEach(slot => {
            const timeSlot = document.createElement('div');
            // Handle different slot formats
            let timeStr = 'Time Slot';
            if (typeof slot === 'string') {
                timeStr = slot;
            } else if (slot && typeof slot === 'object') {
                if (slot.time) {
                    timeStr = utils.formatTime(slot.time);
                } else if (slot.startTime) {
                    timeStr = utils.formatTime(slot.startTime);
                } else {
                    timeStr = utils.formatTime(slot);
                }
            }
            // Check if this slot is already booked
            const slotKey = `${specialistId}_${selectedDate}_${timeStr}`;
            const isBooked = bookedTimeSlots.has(slotKey);
            // Set appropriate classes
            if (isBooked) {
                timeSlot.className = 'time-slot booked';
                timeSlot.title = 'This time slot is already booked';
            } else {
                timeSlot.className = 'time-slot';
            }
            timeSlot.textContent = timeStr;
            // Add click handler only if not booked
            if (!isBooked) {
                timeSlot.onclick = () => {
                    // Remove selected class from all slots
                    container.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    // Add selected class to clicked slot
                    timeSlot.classList.add('selected');
                    if (type === 'booking') {
                        selectedTimeSlot = timeStr;
                    } else {
                        selectedRescheduleTimeSlot = timeStr;
                    }
                };
            } else {
                // Show error message when trying to click booked slot
                timeSlot.onclick = () => {
                    utils.showMessage('This time slot is already booked. Please select another time.', 'error');
                };
            }
            container.appendChild(timeSlot);
        });
    },

    async handleBookingSubmit(event) {
        event.preventDefault();
        const clinicId = document.getElementById('clinicSelect').value;
        const specialistId = document.getElementById('specialistSelect').value;
        const date = document.getElementById('appointmentDate').value;
        const reason = document.getElementById('appointmentReason').value;
        const notes = document.getElementById('patientNotes').value;
        if (!selectedTimeSlot) {
            utils.showMessage('Please select a time slot', 'error');
            return;
        }
        // Double-check for booking conflicts before submitting
        const slotKey = `${specialistId}_${date}_${selectedTimeSlot}`;
        if (bookedTimeSlots.has(slotKey)) {
            utils.showMessage('This time slot has just been booked by another user. Please select a different time.', 'error');
            // Refresh the time slots to show updated availability
            this.handleDateChange({ target: document.getElementById('appointmentDate') });
            return;
        }
        try {
            const clinic = allClinics.find(c => c.id === clinicId);
            const specialist = allSpecialists.find(s => s.id === specialistId);
            const appointmentData = {
                clinicId,
                clinicName: clinic.clinicName || clinic.name,
                specialistId,
                specialistName: specialist.name,
                specialty: specialist.specialty,
                date: new Date(date),
                time: selectedTimeSlot,
                reason,
                notes,
                location: clinic.location
            };
            await dataService.bookAppointment(appointmentData);
            utils.showMessage('Appointment booked successfully!');
            closeBookingModal();
            this.loadAppointments();
        } catch (error) {
            console.error('Error booking appointment:', error);
            if (error.message.includes('already booked')) {
                utils.showMessage(error.message, 'error');
                // Refresh the time slots to show updated availability
                this.handleDateChange({ target: document.getElementById('appointmentDate') });
            } else {
                utils.showMessage('Failed to book appointment', 'error');
            }
        }
    },

    async handleRescheduleSubmit(event) {
        event.preventDefault();
        
        if (!currentAppointmentToReschedule) {
            utils.showMessage('No appointment selected for rescheduling', 'error');
            return;
        }

        const newDate = document.getElementById('newAppointmentDate').value;
        const reason = document.getElementById('rescheduleReason').value;

        if (!selectedRescheduleTimeSlot) {
            utils.showMessage('Please select a time slot', 'error');
            return;
        }

        try {
            await dataService.rescheduleAppointment(
                currentAppointmentToReschedule.id,
                new Date(newDate),
                selectedRescheduleTimeSlot,
                reason
            );
            
            utils.showMessage('Appointment rescheduled successfully!');
            closeRescheduleModal();
            this.loadAppointments();
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            utils.showMessage('Failed to reschedule appointment', 'error');
        }
    }
};

// Global functions for modal handling
window.showBookingModal = (selectedSpecialist = null) => {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'block';
    ui.setupBookingModal(selectedSpecialist);
};

window.closeBookingModal = () => {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'none';
    document.getElementById('bookingForm').reset();
    selectedTimeSlot = null;
};

window.showRescheduleModal = (appointmentId) => {
    const appointment = userAppointments.find(apt => apt.id === appointmentId);
    if (!appointment) {
        utils.showMessage('Appointment not found', 'error');
        return;
    }

    currentAppointmentToReschedule = appointment;
    const modal = document.getElementById('rescheduleModal');
    const infoContainer = document.getElementById('currentAppointmentInfo');

    // Display current appointment info
    infoContainer.innerHTML = `
        <h3>Current Appointment</h3>
        <div class="appointment-details">
            <div class="detail-item">
                <span>👨‍⚕️</span>
                <span><strong>Specialist:</strong> ${appointment.specialistName}</span>
            </div>
            <div class="detail-item">
                <span>📅</span>
                <span><strong>Date:</strong> ${utils.formatDate(appointment.date)}</span>
            </div>
            <div class="detail-item">
                <span>🕒</span>
                <span><strong>Time:</strong> ${appointment.time}</span>
            </div>
        </div>
    `;

    modal.style.display = 'block';
};

window.closeRescheduleModal = () => {
    const modal = document.getElementById('rescheduleModal');
    modal.style.display = 'none';
    document.getElementById('rescheduleForm').reset();
    currentAppointmentToReschedule = null;
    selectedRescheduleTimeSlot = null;
};

window.cancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }

    try {
        await dataService.cancelAppointment(appointmentId);
        utils.showMessage('Appointment cancelled successfully');
        ui.loadAppointments();
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        utils.showMessage('Failed to cancel appointment', 'error');
    }
};

window.viewAppointmentDetails = (appointmentId) => {
    const appointment = userAppointments.find(apt => apt.id === appointmentId);
    if (!appointment) {
        utils.showMessage('Appointment not found', 'error');
        return;
    }

    alert(`
        Appointment Details:
        -----------------
        Specialist: ${appointment.specialistName}
        Specialty: ${appointment.specialty}
        Clinic: ${appointment.clinicName}
        Date: ${utils.formatDate(appointment.date)}
        Time: ${appointment.time}
        Location: ${appointment.location}
        Reason: ${appointment.reason}
        Status: ${appointment.status}
        ${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}
    `);
};

// Initialize the application
async function startApp() {
    try {
        console.log('🚀 Starting appointments page...');
        
        // Check for selected specialist from patientsClinics.html
        const selectedSpecialist = sessionStorage.getItem('selectedSpecialist');
        if (selectedSpecialist) {
            const specialist = JSON.parse(selectedSpecialist);
            console.log('👨‍⚕️ Selected specialist:', specialist);
            // Clear the stored specialist
            sessionStorage.removeItem('selectedSpecialist');
            // Show booking modal with pre-selected specialist
            showBookingModal(specialist);
        }
        
        // Wait for auth state
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                console.log('👤 User authenticated:', user.email);
                await ui.loadAppointments();
            } else {
                console.log('❌ No user authenticated');
                window.location.href = 'login.html';
            }
        });
        
        console.log('✅ Appointments page initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        utils.showMessage('Failed to load appointments. Please refresh the page.', 'error');
    }
}

// Start the application
startApp(); 
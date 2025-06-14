import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

export class MedicalRecordsService {
    constructor() {
        this.userId = null;
        this.setupAuthListener();
    }

    setupAuthListener() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.userId = user.uid;
                console.log('User authenticated:', this.userId);
            } else {
                this.userId = null;
                console.log('User signed out');
            }
        });
    }

    async getMedicalRecords() {
        try {
            if (!this.userId) {
                throw new Error('User not authenticated');
            }

            // First get all records for the patient
            const recordsQuery = query(
                collection(db, 'medicalHistory'),
                where('patientId', '==', this.userId)
            );

            const querySnapshot = await getDocs(recordsQuery);
            const records = [];

            querySnapshot.forEach((doc) => {
                records.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort the records in memory
            records.sort((a, b) => {
                const dateA = a.visitDate ? new Date(a.visitDate) : new Date(0);
                const dateB = b.visitDate ? new Date(b.visitDate) : new Date(0);
                return dateB - dateA; // Descending order
            });

            return records;
        } catch (error) {
            console.error('Error fetching medical records:', error);
            throw error;
        }
    }

    async getClinics() {
        try {
            const clinicsQuery = query(collection(db, 'clinics'));
            const querySnapshot = await getDocs(clinicsQuery);
            const clinics = new Map();

            querySnapshot.forEach((doc) => {
                const clinic = doc.data();
                clinics.set(doc.id, clinic.clinicName || 'Unknown Clinic');
            });

            return clinics;
        } catch (error) {
            console.error('Error fetching clinics:', error);
            throw error;
        }
    }

    async addMedicalRecord(recordData) {
        try {
            if (!this.userId) {
                throw new Error('User not authenticated');
            }

            const recordWithMetadata = {
                ...recordData,
                patientId: this.userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'medicalHistory'), recordWithMetadata);
            return {
                id: docRef.id,
                ...recordWithMetadata
            };
        } catch (error) {
            console.error('Error adding medical record:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const medicalRecordsService = new MedicalRecordsService(); 
import { db } from '../config/firebase.js';

class ApiService {
  // User Management
  async createUser(userData) {
    try {
      const userRef = await db.collection('users').doc(userData.uid).set(userData);
      return { success: true, data: userRef };
    } catch (error) {
      throw error;
    }
  }

  async getUserProfile(uid) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      return { success: true, data: userDoc.data() };
    } catch (error) {
      throw error;
    }
  }

  async updateUserProfile(uid, userData) {
    try {
      await db.collection('users').doc(uid).update(userData);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Specialist Management
  async getSpecialists(filters = {}) {
    try {
      let query = db.collection('specialists');
      
      if (filters.specialty) {
        query = query.where('specialty', '==', filters.specialty);
      }
      if (filters.clinicId) {
        query = query.where('clinicId', '==', filters.clinicId);
      }

      const snapshot = await query.get();
      const specialists = [];
      snapshot.forEach(doc => specialists.push({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: specialists };
    } catch (error) {
      throw error;
    }
  }

  async addSpecialist(specialistData) {
    try {
      const specialistRef = await db.collection('specialists').add(specialistData);
      return { success: true, data: { specialistId: specialistRef.id } };
    } catch (error) {
      throw error;
    }
  }

  // Appointment Management
  async bookAppointment(appointmentData) {
    try {
      // Verify specialist availability
      const existingAppointment = await db.collection('appointments')
        .where('specialistId', '==', appointmentData.specialistId)
        .where('date', '==', appointmentData.date)
        .where('time', '==', appointmentData.time)
        .where('status', '==', 'confirmed')
        .get();

      if (!existingAppointment.empty) {
        throw new Error('Time slot already booked');
      }

      const appointmentRef = await db.collection('appointments').add(appointmentData);
      return { success: true, data: { appointmentId: appointmentRef.id } };
    } catch (error) {
      throw error;
    }
  }

  async getAppointments(filters) {
    try {
      let query = db.collection('appointments');
      
      if (filters.patientId) {
        query = query.where('patientId', '==', filters.patientId);
      }
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.startDate) {
        query = query.where('date', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('date', '<=', filters.endDate);
      }

      const snapshot = await query.orderBy('date', 'desc').get();
      const appointments = [];
      snapshot.forEach(doc => appointments.push({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: appointments };
    } catch (error) {
      throw error;
    }
  }

  // Medical Records Management
  async getMedicalHistory(patientId) {
    try {
      const snapshot = await db.collection('medicalHistory')
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc')
        .get();

      const history = [];
      snapshot.forEach(doc => history.push({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: history };
    } catch (error) {
      throw error;
    }
  }

  async addMedicalRecord(recordData) {
    try {
      const recordRef = await db.collection('medicalHistory').add(recordData);
      return { success: true, data: { recordId: recordRef.id } };
    } catch (error) {
      throw error;
    }
  }

  // Lab Tests Management
  async getLabTests(patientId) {
    try {
      const snapshot = await db.collection('labTests')
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc')
        .get();

      const tests = [];
      snapshot.forEach(doc => tests.push({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: tests };
    } catch (error) {
      throw error;
    }
  }

  async addLabTest(testData) {
    try {
      const testRef = await db.collection('labTests').add(testData);
      return { success: true, data: { testId: testRef.id } };
    } catch (error) {
      throw error;
    }
  }

  // Clinic Management
  async getClinics() {
    try {
      const snapshot = await db.collection('clinics').get();
      const clinics = [];
      snapshot.forEach(doc => clinics.push({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: clinics };
    } catch (error) {
      throw error;
    }
  }

  async addClinic(clinicData) {
    try {
      const clinicRef = await db.collection('clinics').add(clinicData);
      return { success: true, data: { clinicId: clinicRef.id } };
    } catch (error) {
      throw error;
    }
  }

  // Notifications
  async getNotifications(userId) {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const notifications = [];
      snapshot.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: notifications };
    } catch (error) {
      throw error;
    }
  }

  async markNotificationRead(notificationId) {
    try {
      await db.collection('notifications').doc(notificationId).update({
        read: true,
        readAt: new Date()
      });
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Health Resources
  async getHealthResources(filters = {}) {
    try {
      let query = db.collection('healthResources');
      
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      const snapshot = await query.get();
      const resources = [];
      snapshot.forEach(doc => resources.push({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: resources };
    } catch (error) {
      throw error;
    }
  }
}

export const apiService = new ApiService();
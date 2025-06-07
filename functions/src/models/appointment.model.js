const { collections, addTimestamps } = require('../config/database');

class Appointment {
  static async create(data) {
    const appointmentData = {
      appointmentId: collections.appointments.doc().id,
      patientId: data.patientId,
      specialistId: data.specialistId,
      clinicId: data.clinicId,
      date: data.date,
      time: data.time,
      status: 'scheduled',
      appointmentType: data.appointmentType || 'consultation',
      reason: data.reason,
      notes: data.notes || '',
      duration: data.duration || 30
    };

    // Check for conflicting appointments
    const isAvailable = await this.checkAvailability(
      appointmentData.specialistId,
      appointmentData.date,
      appointmentData.time
    );

    if (!isAvailable) {
      throw new Error('Time slot is not available');
    }

    const docRef = collections.appointments.doc(appointmentData.appointmentId);
    await docRef.set(addTimestamps(appointmentData));
    return { id: docRef.id, ...appointmentData };
  }

  static async findById(id) {
    const doc = await collections.appointments.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findByPatient(patientId, options = {}) {
    const { status, startDate } = options;
    let query = collections.appointments
      .where('patientId', '==', patientId)
      .orderBy('date', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async findBySpecialist(specialistId, date) {
    const snapshot = await collections.appointments
      .where('specialistId', '==', specialistId)
      .where('date', '==', date)
      .where('status', '==', 'scheduled')
      .orderBy('time')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(id, data) {
    const updateData = addTimestamps(data, false);
    await collections.appointments.doc(id).update(updateData);
    return this.findById(id);
  }

  static async cancel(id, reason) {
    const updateData = addTimestamps({
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString()
    }, false);

    await collections.appointments.doc(id).update(updateData);
    return this.findById(id);
  }

  static async complete(id, notes) {
    const updateData = addTimestamps({
      status: 'completed',
      notes: notes || ''
    }, false);

    await collections.appointments.doc(id).update(updateData);
    return this.findById(id);
  }

  static async checkAvailability(specialistId, date, time) {
    const snapshot = await collections.appointments
      .where('specialistId', '==', specialistId)
      .where('date', '==', date)
      .where('time', '==', time)
      .where('status', '==', 'scheduled')
      .get();

    return snapshot.empty;
  }
}

module.exports = Appointment;

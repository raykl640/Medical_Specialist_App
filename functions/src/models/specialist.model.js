const { collections, addTimestamps } = require('../config/database');

class Specialist {
  static async create(data) {
    const specialistData = {
      specialistId: collections.specialists.doc().id,
      name: data.name,
      specialty: data.specialty,
      clinicId: data.clinicId,
      qualifications: data.qualifications || [],
      experience: data.experience || '',
      languages: data.languages || [],
      availability: data.availability || [],
      consultationFee: data.consultationFee
    };

    const docRef = collections.specialists.doc(specialistData.specialistId);
    await docRef.set(addTimestamps(specialistData));
    return { id: docRef.id, ...specialistData };
  }

  static async findById(id) {
    const doc = await collections.specialists.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findByClinic(clinicId) {
    const snapshot = await collections.specialists
      .where('clinicId', '==', clinicId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(id, data) {
    const docRef = collections.specialists.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Specialist not found');

    const updates = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await docRef.update(updates);
    return { id, ...doc.data(), ...updates };
  }

  static async delete(id) {
    const docRef = collections.specialists.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Specialist not found');

    await docRef.delete();
    return { id, ...doc.data() };
  }

  static async findAvailable(clinicId, date, time) {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    const snapshot = await collections.specialists
      .where('clinicId', '==', clinicId)
      .where(`availability.${dayOfWeek}.available`, '==', true)
      .get();

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(specialist => {
        const schedule = specialist.availability.find(a => a.day === dayOfWeek);
        if (!schedule) return false;
        return time >= schedule.startTime && time <= schedule.endTime;
      });
  }
}

module.exports = Specialist;

const { collections, addTimestamps } = require('../config/database');

class MedicalHistory {
  static async create(data) {
    const historyData = {
      historyId: collections.medicalHistory.doc().id,
      patientId: data.patientId,
      type: data.type,
      title: data.title,
      description: data.description || '',
      date: data.date,
      status: data.status || 'active',
      treatedBy: {
        specialistId: data.treatedBy?.specialistId || null,
        clinicId: data.treatedBy?.clinicId || null
      },
      attachments: data.attachments || []
    };

    const docRef = collections.medicalHistory.doc(historyData.historyId);
    await docRef.set(addTimestamps(historyData));
    return { id: docRef.id, ...historyData };
  }

  static async findById(id) {
    const doc = await collections.medicalHistory.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findByPatient(patientId) {
    const snapshot = await collections.medicalHistory
      .where('patientId', '==', patientId)
      .orderBy('date', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(id, data) {
    const docRef = collections.medicalHistory.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Medical history record not found');

    const updates = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await docRef.update(updates);
    return { id, ...doc.data(), ...updates };
  }

  static async delete(id) {
    const docRef = collections.medicalHistory.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Medical history record not found');

    await docRef.delete();
    return { id, ...doc.data() };
  }
}

module.exports = MedicalHistory;

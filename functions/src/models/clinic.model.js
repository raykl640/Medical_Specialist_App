const { collections, addTimestamps } = require('../config/database');

class Clinic {
  static async create(data) {
    const clinicData = {
      clinicId: collections.clinics.doc().id,
      clinicName: data.clinicName,
      location: data.location,
      address: data.address,
      phoneNumber: data.phoneNumber,
      email: data.email,
      operatingHours: {
        monday: { open: data.operatingHours?.monday?.open || '', close: data.operatingHours?.monday?.close || '' },
        tuesday: { open: data.operatingHours?.tuesday?.open || '', close: data.operatingHours?.tuesday?.close || '' },
        wednesday: { open: data.operatingHours?.wednesday?.open || '', close: data.operatingHours?.wednesday?.close || '' },
        thursday: { open: data.operatingHours?.thursday?.open || '', close: data.operatingHours?.thursday?.close || '' },
        friday: { open: data.operatingHours?.friday?.open || '', close: data.operatingHours?.friday?.close || '' },
        saturday: { open: data.operatingHours?.saturday?.open || '', close: data.operatingHours?.saturday?.close || '' },
        sunday: { open: data.operatingHours?.sunday?.open || '', close: data.operatingHours?.sunday?.close || '' }
      },
      isActive: true
    };

    const docRef = collections.clinics.doc(clinicData.clinicId);
    await docRef.set(addTimestamps(clinicData));
    return { id: docRef.id, ...clinicData };
  }

  static async findById(id) {
    const doc = await collections.clinics.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findAll(options = {}) {
    const { isActive = true } = options;
    let query = collections.clinics;
    
    if (typeof isActive === 'boolean') {
      query = query.where('isActive', '==', isActive);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(id, data) {
    const updateData = addTimestamps(data, false);
    await collections.clinics.doc(id).update(updateData);
    return this.findById(id);
  }

  static async delete(id) {
    await collections.clinics.doc(id).update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });
    return true;
  }

  static async getSpecialists(clinicId) {
    const snapshot = await collections.specialists
      .where('clinicId', '==', clinicId)
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Clinic;

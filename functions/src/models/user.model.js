const { collections, addTimestamps } = require('../config/database');

class User {
  static async create(data) {
    const userData = {
      uid: data.uid,
      email: data.email,
      userType: data.userType,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || '',
      emergencyContacts: data.emergencyContacts || [],
      knownAllergies: data.knownAllergies || []
    };

    const docRef = collections.users.doc(userData.uid);
    await docRef.set(addTimestamps(userData));
    return { id: docRef.id, ...userData };
  }

  static async findById(id) {
    const doc = await collections.users.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findByEmail(email) {
    const snapshot = await collections.users
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  static async update(id, data) {
    const docRef = collections.users.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('User not found');

    const updates = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await docRef.update(updates);
    return { id, ...doc.data(), ...updates };
  }

  static async delete(id) {
    const docRef = collections.users.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('User not found');

    await docRef.delete();
    return { id, ...doc.data() };
  }

  static async addEmergencyContact(id, contact) {
    const docRef = collections.users.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('User not found');

    const userData = doc.data();
    const emergencyContacts = [...(userData.emergencyContacts || []), contact];

    await docRef.update({ 
      emergencyContacts,
      updatedAt: new Date().toISOString()
    });

    return { id, ...userData, emergencyContacts };
  }

  static async addAllergy(id, allergy) {
    const docRef = collections.users.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('User not found');

    const userData = doc.data();
    const knownAllergies = [...new Set([...(userData.knownAllergies || []), allergy])];

    await docRef.update({ 
      knownAllergies,
      updatedAt: new Date().toISOString()
    });

    return { id, ...userData, knownAllergies };
  }
}

module.exports = User;

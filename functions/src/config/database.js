const { db } = require('./firebase');

// Define Firestore collections
const collections = {
  users: db.collection('users'),
  specialists: db.collection('specialists'),
  appointments: db.collection('appointments'),
  medicalHistory: db.collection('medicalHistory'),
  labTests: db.collection('labTests'),
  clinics: db.collection('clinics')
};

// Helper function to add timestamps to documents
const addTimestamps = (data, isNew = true) => {
  const now = new Date().toISOString();
  const timestamps = {
    updatedAt: now
  };
  
  if (isNew) {
    timestamps.createdAt = now;
  }
  
  return { ...data, ...timestamps };
};

// Helper function to get a subcollection
const getSubcollection = (collectionName, docId, subcollectionName) => {
  return collections[collectionName].doc(docId).collection(subcollectionName);
};

module.exports = {
  collections,
  addTimestamps,
  getSubcollection
};

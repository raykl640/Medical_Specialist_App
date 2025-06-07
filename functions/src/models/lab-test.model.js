const { collections, addTimestamps, getSubcollection } = require('../config/database');

class LabTest {
  static async create(data) {
    const testData = {
      testId: collections.labTests.doc().id,
      patientId: data.patientId,
      clinicId: data.clinicId,
      historyId: data.historyId,
      testName: data.testName,
      testType: data.testType || 'blood',
      testDate: data.testDate || new Date().toISOString(),
      orderedBy: data.orderedBy,
      status: 'ordered',
      results: '',
      interpretation: '',
      attachments: []
    };

    const docRef = collections.labTests.doc(testData.testId);
    await docRef.set(addTimestamps(testData));
    return { id: docRef.id, ...testData };
  }

  static async findById(id) {
    const doc = await collections.labTests.doc(id).get();
    if (!doc.exists) return null;
    
    // Get test parameters
    const paramsSnapshot = await getSubcollection('labTests', id, 'parameters').get();
    const parameters = paramsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      id: doc.id,
      ...doc.data(),
      parameters
    };
  }

  static async findByPatient(patientId, options = {}) {
    const { status, startDate } = options;
    let query = collections.labTests
      .where('patientId', '==', patientId)
      .orderBy('testDate', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (startDate) {
      query = query.where('testDate', '>=', startDate);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(id, data) {
    const updateData = addTimestamps(data, false);
    await collections.labTests.doc(id).update(updateData);
    return this.findById(id);
  }

  static async addParameter(testId, paramData) {
    const paramRef = getSubcollection('labTests', testId, 'parameters').doc();
    const parameter = {
      parameterId: paramRef.id,
      testId,
      name: paramData.name,
      result: paramData.result,
      unit: paramData.unit,
      referenceRange: paramData.referenceRange,
      isAbnormal: paramData.isAbnormal || false
    };

    await paramRef.set(addTimestamps(parameter));
    return { id: paramRef.id, ...parameter };
  }

  static async updateParameters(testId, parameters) {
    const batch = collections.db.batch();
    const paramsCollection = getSubcollection('labTests', testId, 'parameters');

    // Delete existing parameters
    const existing = await paramsCollection.get();
    existing.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add new parameters
    parameters.forEach(param => {
      const paramRef = paramsCollection.doc();
      batch.set(paramRef, addTimestamps({
        parameterId: paramRef.id,
        testId,
        ...param
      }));
    });

    await batch.commit();
    return this.findById(testId);
  }

  static async addAttachment(id, fileUrl) {
    const doc = await collections.labTests.doc(id).get();
    const attachments = doc.data().attachments || [];
    await doc.ref.update({
      attachments: [...attachments, fileUrl],
      updatedAt: new Date().toISOString()
    });
    return this.findById(id);
  }
}

module.exports = LabTest;

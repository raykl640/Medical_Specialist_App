/**
 * Cloud Functions for Medical Specialist App - Clinic Management
 * 
 * This file contains Firebase Cloud Functions for managing clinics.
 * These functions provide a REST API interface for clinic operations.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Helper function to validate authentication
async function validateAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No valid token provided');
  }
  
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Unauthorized: Invalid token');
  }
}

// Helper function to handle errors
function handleError(res, error, defaultMessage = 'Internal server error') {
  console.error('Function error:', error);
  
  const statusCode = error.message.includes('Unauthorized') ? 401 :
                    error.message.includes('required') ? 400 : 500;
  
  res.status(statusCode).json({
    success: false,
    error: error.message || defaultMessage,
    timestamp: new Date().toISOString()
  });
}

// Helper function to validate clinic data
function validateClinicData(data, isUpdate = false) {
  const { clinicName, location } = data;
  
  if (!isUpdate && (!clinicName || !location)) {
    throw new Error('Clinic name and location are required');
  }
  
  if (clinicName && clinicName.trim().length < 2) {
    throw new Error('Clinic name must be at least 2 characters long');
  }
  
  if (location && location.trim().length < 2) {
    throw new Error('Location must be at least 2 characters long');
  }
  
  return {
    clinicName: clinicName?.trim(),
    location: location?.trim()
  };
}

/**
 * Create a new clinic
 * POST /createClinic
 * Body: { clinicName: string, location: string }
 */
exports.createClinic = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate HTTP method
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Method not allowed. Use POST."
        });
      }

      // Validate authentication
      const decodedToken = await validateAuth(req);
      
      // Validate and sanitize input data
      const validatedData = validateClinicData(req.body);
      
      // Create clinic document
      const clinicData = {
        ...validatedData,
        createdBy: decodedToken.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };
      
      const clinicRef = await db.collection("clinics").add(clinicData);
      
      console.log(`✅ Clinic created: ${clinicRef.id} by user: ${decodedToken.email}`);
      
      res.json({
        success: true,
        clinicId: clinicRef.id,
        message: "Clinic created successfully",
        data: {
          clinicId: clinicRef.id,
          clinicName: validatedData.clinicName,
          location: validatedData.location
        }
      });
      
    } catch (error) {
      handleError(res, error, "Failed to create clinic");
    }
  });
});

/**
 * Get all clinics for the authenticated user
 * GET /getClinics
 */
exports.getClinics = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate HTTP method
      if (req.method !== "GET") {
        return res.status(405).json({
          success: false,
          error: "Method not allowed. Use GET."
        });
      }

      // Validate authentication
      const decodedToken = await validateAuth(req);
      
      // Get clinics for the user
      const snapshot = await db.collection("clinics")
        .where("createdBy", "==", decodedToken.uid)
        .where("isActive", "==", true)
        .orderBy("createdAt", "desc")
        .get();
      
      const clinics = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        clinics.push({
          clinicId: doc.id,
          clinicName: data.clinicName,
          location: data.location,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          isActive: data.isActive
        });
      });
      
      console.log(`✅ Retrieved ${clinics.length} clinics for user: ${decodedToken.email}`);
      
      res.json({
        success: true,
        clinics,
        count: clinics.length,
        message: `Retrieved ${clinics.length} clinics`
      });
      
    } catch (error) {
      handleError(res, error, "Failed to get clinics");
    }
  });
});

/**
 * Update an existing clinic
 * PUT /updateClinic
 * Body: { clinicId: string, clinicName?: string, location?: string }
 */
exports.updateClinic = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate HTTP method
      if (req.method !== "PUT") {
        return res.status(405).json({
          success: false,
          error: "Method not allowed. Use PUT."
        });
      }

      // Validate authentication
      const decodedToken = await validateAuth(req);
      
      const { clinicId } = req.body;
      if (!clinicId) {
        throw new Error('Clinic ID is required');
      }
      
      // Validate and sanitize input data
      const validatedData = validateClinicData(req.body, true);
      
      // Check if clinic exists and belongs to user
      const clinicRef = db.collection("clinics").doc(clinicId);
      const clinicDoc = await clinicRef.get();
      
      if (!clinicDoc.exists) {
        throw new Error('Clinic not found');
      }
      
      const clinicData = clinicDoc.data();
      if (clinicData.createdBy !== decodedToken.uid) {
        throw new Error('Unauthorized: You can only update your own clinics');
      }
      
      // Prepare update data
      const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (validatedData.clinicName) {
        updateData.clinicName = validatedData.clinicName;
      }
      if (validatedData.location) {
        updateData.location = validatedData.location;
      }
      
      // Update clinic
      await clinicRef.update(updateData);
      
      console.log(`✅ Clinic updated: ${clinicId} by user: ${decodedToken.email}`);
      
      res.json({
        success: true,
        message: "Clinic updated successfully",
        data: {
          clinicId,
          ...updateData
        }
      });
      
    } catch (error) {
      handleError(res, error, "Failed to update clinic");
    }
  });
});

/**
 * Delete a clinic (soft delete)
 * DELETE /deleteClinic
 * Body: { clinicId: string }
 */
exports.deleteClinic = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate HTTP method
      if (req.method !== "DELETE") {
        return res.status(405).json({
          success: false,
          error: "Method not allowed. Use DELETE."
        });
      }

      // Validate authentication
      const decodedToken = await validateAuth(req);
      
      const { clinicId } = req.body;
      if (!clinicId) {
        throw new Error('Clinic ID is required');
      }
      
      // Check if clinic exists and belongs to user
      const clinicRef = db.collection("clinics").doc(clinicId);
      const clinicDoc = await clinicRef.get();
      
      if (!clinicDoc.exists) {
        throw new Error('Clinic not found');
      }
      
      const clinicData = clinicDoc.data();
      if (clinicData.createdBy !== decodedToken.uid) {
        throw new Error('Unauthorized: You can only delete your own clinics');
      }
      
      // Soft delete - mark as inactive instead of actual deletion
      await clinicRef.update({
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Clinic soft deleted: ${clinicId} by user: ${decodedToken.email}`);
      
      res.json({
        success: true,
        message: "Clinic deleted successfully",
        data: {
          clinicId,
          deletedAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      handleError(res, error, "Failed to delete clinic");
    }
  });
});

/**
 * Get clinic statistics for the authenticated user
 * GET /getClinicStats
 */
exports.getClinicStats = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate HTTP method
      if (req.method !== "GET") {
        return res.status(405).json({
          success: false,
          error: "Method not allowed. Use GET."
        });
      }

      // Validate authentication
      const decodedToken = await validateAuth(req);
      
      // Get all clinics for the user (including deleted ones for stats)
      const allClinicsSnapshot = await db.collection("clinics")
        .where("createdBy", "==", decodedToken.uid)
        .get();
      
      const activeClinicsSnapshot = await db.collection("clinics")
        .where("createdBy", "==", decodedToken.uid)
        .where("isActive", "==", true)
        .get();
      
      const stats = {
        totalClinics: allClinicsSnapshot.size,
        activeClinics: activeClinicsSnapshot.size,
        deletedClinics: allClinicsSnapshot.size - activeClinicsSnapshot.size,
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`✅ Retrieved clinic stats for user: ${decodedToken.email}`);
      
      res.json({
        success: true,
        stats,
        message: "Clinic statistics retrieved successfully"
      });
      
    } catch (error) {
      handleError(res, error, "Failed to get clinic statistics");
    }
  });
});

/**
 * Health check endpoint
 * GET /health
 */
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    res.json({
      success: true,
      message: "Clinic Management API is healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });
});

/**
 * Batch operations for clinics
 * POST /batchOperations
 * Body: { 
 *   operation: 'delete' | 'activate' | 'deactivate',
 *   clinicIds: string[]
 * }
 */
exports.batchOperations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate HTTP method
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Method not allowed. Use POST."
        });
      }

      // Validate authentication
      const decodedToken = await validateAuth(req);
      
      const { operation, clinicIds } = req.body;
      
      if (!operation || !clinicIds || !Array.isArray(clinicIds)) {
        throw new Error('Operation and clinicIds array are required');
      }
      
      if (!['delete', 'activate', 'deactivate'].includes(operation)) {
        throw new Error('Invalid operation. Use: delete, activate, or deactivate');
      }
      
      if (clinicIds.length === 0) {
        throw new Error('At least one clinic ID is required');
      }
      
      if (clinicIds.length > 50) {
        throw new Error('Maximum 50 clinics can be processed in a single batch');
      }
      
      // Process batch operation
      const batch = db.batch();
      const results = [];
      
      for (const clinicId of clinicIds) {
        try {
          const clinicRef = db.collection("clinics").doc(clinicId);
          const clinicDoc = await clinicRef.get();
          
          if (!clinicDoc.exists) {
            results.push({ clinicId, status: 'error', message: 'Clinic not found' });
            continue;
          }
          
          const clinicData = clinicDoc.data();
          if (clinicData.createdBy !== decodedToken.uid) {
            results.push({ clinicId, status: 'error', message: 'Unauthorized' });
            continue;
          }
          
          // Apply operation
          let updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          switch (operation) {
            case 'delete':
              updateData.isActive = false;
              updateData.deletedAt = admin.firestore.FieldValue.serverTimestamp();
              break;
            case 'activate':
              updateData.isActive = true;
              break;
            case 'deactivate':
              updateData.isActive = false;
              break;
          }
          
          batch.update(clinicRef, updateData);
          results.push({ clinicId, status: 'success', operation });
          
        } catch (error) {
          results.push({ clinicId, status: 'error', message: error.message });
        }
      }
      
      // Commit batch
      await batch.commit();
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      console.log(`✅ Batch ${operation} completed: ${successCount} successful, ${errorCount} errors for user: ${decodedToken.email}`);
      
      res.json({
        success: true,
        message: `Batch ${operation} completed`,
        results,
        summary: {
          total: clinicIds.length,
          successful: successCount,
          errors: errorCount
        }
      });
      
    } catch (error) {
      handleError(res, error, "Failed to perform batch operation");
    }
  });
});

// Export configuration for easier testing
exports.config = {
  maxBatchSize: 50,
  allowedOperations: ['delete', 'activate', 'deactivate']
};
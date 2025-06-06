const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { verifyAuth } = require('./src/middleware/auth.middleware');
const { db } = require('./src/config/firebase');
require('./src/config/database'); // Initialize MongoDB connection

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Auth middleware for protected routes
const authMiddleware = async (req, res, next) => {
  try {
    const decodedToken = await verifyAuth(req);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Protected routes
app.use('/api/*', authMiddleware);

// Import route handlers
const userRoutes = require('./src/routes/user.routes');
const specialistRoutes = require('./src/routes/specialist.routes');
const appointmentRoutes = require('./src/routes/appointment.routes');
const clinicRoutes = require('./src/routes/clinic.routes');
const medicalHistoryRoutes = require('./src/routes/medical-history.routes');
const labTestRoutes = require('./src/routes/lab-test.routes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/specialists', specialistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/medical-history', medicalHistoryRoutes);
app.use('/api/lab-tests', labTestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

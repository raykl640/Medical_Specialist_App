import cors from 'cors';
import express from 'express';
import { admin } from './config/firebase.js';
import { verifyAuth } from './middleware/auth.middleware.js';
import { apiService } from './services/api.service.js';

const app = express();

// Middleware
app.use(cors());
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

// User routes
app.get('/api/users/:uid/profile', async (req, res) => {
  try {
    const result = await apiService.getUserProfile(req.params.uid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:uid/profile', async (req, res) => {
  try {
    const result = await apiService.updateUserProfile(req.params.uid, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Specialist routes
app.get('/api/specialists', async (req, res) => {
  try {
    const result = await apiService.getSpecialists(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Appointment routes
app.post('/api/appointments', async (req, res) => {
  try {
    const result = await apiService.bookAppointment({
      ...req.body,
      patientId: req.user.uid,
      status: 'confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const result = await apiService.getAppointments({
      ...req.query,
      patientId: req.user.uid
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Medical records routes
app.get('/api/medical-history/:patientId', async (req, res) => {
  try {
    const result = await apiService.getMedicalHistory(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lab-tests/:patientId', async (req, res) => {
  try {
    const result = await apiService.getLabTests(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clinic routes
app.get('/api/clinics', async (req, res) => {
  try {
    const result = await apiService.getClinics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notification routes
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await apiService.getNotifications(req.user.uid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const result = await apiService.markNotificationRead(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health resources routes
app.get('/api/health-resources', async (req, res) => {
  try {
    const result = await apiService.getHealthResources(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
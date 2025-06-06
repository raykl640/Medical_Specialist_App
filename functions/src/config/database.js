const mongoose = require('mongoose');
const User = require('../models/user.model');
const Specialist = require('../models/specialist.model');
const Appointment = require('../models/appointment.model');
const MedicalHistory = require('../models/medical-history.model');
const LabTest = require('../models/lab-test.model');
const Clinic = require('../models/clinic.model');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-specialist-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Export models for use in other files
module.exports = {
  User,
  Specialist,
  Appointment,
  MedicalHistory,
  LabTest,
  Clinic,
  mongoose
};

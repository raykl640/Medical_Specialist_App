const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Firebase UID
  specialistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialist', required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  time: { type: String, required: true }, // HH:mm format
  status: { 
    type: String, 
    enum: ['confirmed', 'cancelled', 'completed'], 
    default: 'confirmed' 
  },
  reason: { type: String, required: true },
  notes: String,
  cancellationReason: String,
  cancelledAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for querying appointments by specialist and date
appointmentSchema.index({ specialistId: 1, date: 1, time: 1 });
// Index for querying patient appointments
appointmentSchema.index({ patientId: 1, date: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Firebase UID
  type: { 
    type: String, 
    enum: ['condition', 'surgery', 'allergy', 'medication', 'vaccination'],
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'resolved', 'ongoing'],
    default: 'active'
  },
  treatedBy: {
    specialistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialist' },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' }
  },
  attachments: [{
    type: { type: String },
    url: { type: String },
    name: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

medicalHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

medicalHistorySchema.index({ patientId: 1, type: 1, date: -1 });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);

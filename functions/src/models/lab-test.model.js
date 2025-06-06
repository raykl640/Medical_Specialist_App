const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Firebase UID
  testName: { type: String, required: true },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialist' },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  orderDate: { type: Date, required: true },
  collectionDate: Date,
  reportDate: Date,
  status: {
    type: String,
    enum: ['ordered', 'collected', 'processing', 'completed', 'cancelled'],
    default: 'ordered'
  },
  results: [{
    parameter: { type: String, required: true },
    value: { type: String, required: true },
    unit: String,
    referenceRange: String,
    flag: { type: String, enum: ['normal', 'high', 'low', 'critical'] }
  }],
  interpretation: String,
  notes: String,
  attachments: [{
    type: { type: String },
    url: { type: String },
    name: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

labTestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

labTestSchema.index({ patientId: 1, orderDate: -1 });

module.exports = mongoose.model('LabTest', labTestSchema);

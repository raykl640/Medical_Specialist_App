const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  services: [String],
  workingHours: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isClosed: { type: Boolean, default: false }
  }],
  facilities: [String],
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

clinicSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for geospatial queries if coordinates are provided
clinicSchema.index({ 
  "coordinates": "2dsphere"
}, { sparse: true });

module.exports = mongoose.model('Clinic', clinicSchema);

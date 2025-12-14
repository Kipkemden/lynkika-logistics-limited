const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  origin: {
    city: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  destination: {
    city: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
      required: true
    },
    departureTime: {
      type: String,
      required: true
    },
    estimatedDuration: {
      type: Number, // in hours
      required: true
    }
  },
  capacity: {
    maxWeight: { type: Number, required: true }, // in kg
    maxVolume: { type: Number, required: true }, // in cubic meters
    maxParcels: { type: Number, required: true }
  },
  pricing: {
    baseRate: { type: Number, required: true },
    perKgRate: { type: Number, required: true },
    perCubicMeterRate: { type: Number, required: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  cutoffHours: {
    type: Number,
    default: 24 // hours before departure
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
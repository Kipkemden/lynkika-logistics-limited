const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    required: true,
    unique: true
  },
  serviceType: {
    type: String,
    enum: ['movers', 'freight', 'scheduled_route', 'courier'],
    required: true
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: String
  },
  pickup: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    date: { type: Date, required: true },
    timeSlot: String,
    contactPerson: String,
    contactPhone: String,
    instructions: String
  },
  delivery: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    date: Date,
    timeSlot: String,
    contactPerson: String,
    contactPhone: String,
    instructions: String
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    weight: Number, // in kg
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    value: Number,
    fragile: { type: Boolean, default: false }
  }],
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  pricing: {
    baseAmount: { type: Number, required: true },
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  tracking: [{
    status: String,
    location: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  assignedVehicle: {
    plateNumber: String,
    driverName: String,
    driverPhone: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  specialInstructions: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate booking reference
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    const prefix = this.serviceType.charAt(0).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    this.bookingReference = `${prefix}${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
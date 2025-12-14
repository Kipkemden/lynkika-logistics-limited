const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  quoteReference: {
    type: String,
    required: true,
    unique: true
  },
  serviceType: {
    type: String,
    enum: ['movers', 'freight', 'scheduled_route'],
    required: true
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: String
  },
  origin: {
    address: { type: String, required: true },
    city: { type: String, required: true }
  },
  destination: {
    address: { type: String, required: true },
    city: { type: String, required: true }
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  }],
  preferredDate: Date,
  estimatedPrice: {
    baseAmount: Number,
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    totalAmount: Number,
    currency: { type: String, default: 'USD' }
  },
  status: {
    type: String,
    enum: ['pending', 'quoted', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  validUntil: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  notes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate quote reference
quoteSchema.pre('save', function(next) {
  if (!this.quoteReference) {
    const prefix = 'Q';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    this.quoteReference = `${prefix}${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Quote', quoteSchema);
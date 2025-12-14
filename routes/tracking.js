const express = require('express');
const bookingService = require('../services/bookingService');
const { publicApiLimiter, sanitizeResponse } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all tracking routes
router.use(publicApiLimiter);

// Public tracking endpoint - rate limited and sanitized
router.get('/:reference', 
  sanitizeResponse(['reference', 'serviceType', 'status', 'pickup', 'delivery', 'timeline']),
  async (req, res) => {
  try {
    const booking = await bookingService.getBookingByReference(req.params.reference);
    
    if (!booking) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    // Get tracking history
    const trackingHistory = await bookingService.getTrackingHistory(booking.id);
    
    // Format tracking data for public consumption
    const trackingData = {
      reference: booking.booking_reference,
      serviceType: booking.service_type,
      status: booking.status,
      pickup: {
        city: booking.pickup_city,
        date: booking.pickup_date
      },
      delivery: {
        city: booking.delivery_city,
        estimatedDate: booking.delivery_date
      },
      timeline: trackingHistory.map(entry => ({
        status: entry.status,
        location: entry.location,
        timestamp: entry.created_at,
        notes: entry.notes
      })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    };
    
    res.json(trackingData);
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const bookingService = require('../services/bookingService');
const routeService = require('../services/routeService');
const { publicApiLimiter, sanitizeResponse } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all booking routes
router.use(publicApiLimiter);

// Create booking - public but rate limited and sanitized
router.post('/', 
  sanitizeResponse(['message', 'bookingReference', 'status']),
  async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate capacity for scheduled routes
    if (bookingData.serviceType === 'scheduled_route' && bookingData.route) {
      const route = await routeService.getRouteById(bookingData.route);
      if (!route) {
        return res.status(400).json({ message: 'Route not found' });
      }
      
      // Check existing bookings for this route
      const existingBookings = await bookingService.getBookingsForRoute(
        bookingData.route,
        bookingData.pickup.date
      );
      
      let totalWeight = 0;
      let totalVolume = 0;
      let totalParcels = 0;
      
      existingBookings.forEach(b => {
        b.items.forEach(item => {
          totalWeight += item.weight || 0;
          totalParcels += item.quantity;
          if (item.dimensions) {
            const volume = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 1000000;
            totalVolume += volume * item.quantity;
          }
        });
      });
      
      // Add current booking items
      bookingData.items.forEach(item => {
        totalWeight += item.weight || 0;
        totalParcels += item.quantity;
        if (item.dimensions) {
          const volume = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 1000000;
          totalVolume += volume * item.quantity;
        }
      });
      
      if (totalWeight > route.max_weight || 
          totalVolume > route.max_volume || 
          totalParcels > route.max_parcels) {
        return res.status(400).json({ message: 'Route capacity exceeded' });
      }
    }
    
    const booking = await bookingService.createBooking(bookingData);
    
    res.status(201).json({
      message: 'Booking created successfully',
      bookingReference: booking.booking_reference,
      status: 'confirmed'
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by reference - public but rate limited and sanitized
router.get('/:reference', 
  sanitizeResponse(['booking_reference', 'service_type', 'status', 'pickup_city', 'delivery_city', 'pickup_date', 'delivery_date', 'created_at']),
  async (req, res) => {
  try {
    const booking = await bookingService.getBookingByReference(req.params.reference);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
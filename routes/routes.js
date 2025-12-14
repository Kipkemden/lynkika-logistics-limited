const express = require('express');
const routeService = require('../services/routeService');
const bookingService = require('../services/bookingService');
const { publicApiLimiter, sanitizeResponse } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all route routes
router.use(publicApiLimiter);

// Get all active routes (public) - rate limited and sanitized
router.get('/', 
  sanitizeResponse(['_id', 'routeCode', 'name', 'origin', 'destination', 'schedule', 'pricing']),
  async (req, res) => {
  try {
    const routes = await routeService.getAllRoutes(true);
    
    // Format routes for public consumption
    const formattedRoutes = routes.map(route => ({
      _id: route.id,
      routeCode: route.route_code,
      name: route.name,
      origin: {
        city: route.origin_city,
        address: route.origin_address
      },
      destination: {
        city: route.destination_city,
        address: route.destination_address
      },
      schedule: {
        frequency: route.frequency,
        departureTime: route.departure_time,
        estimatedDuration: route.estimated_duration
      },
      pricing: {
        baseRate: route.base_rate,
        perKgRate: route.per_kg_rate,
        perCubicMeterRate: route.per_cubic_meter_rate
      }
    }));
    
    res.json(formattedRoutes);
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get route capacity for specific date - rate limited and sanitized
router.get('/:routeId/capacity/:date', 
  sanitizeResponse(['available', 'utilizationPercentage']),
  async (req, res) => {
  try {
    const { routeId, date } = req.params;
    
    console.log(`Fetching capacity for route ${routeId} on date ${date}`);
    
    const route = await routeService.getRouteById(routeId);
    if (!route) {
      console.log(`Route ${routeId} not found`);
      return res.status(404).json({ message: 'Route not found' });
    }
    
    // Get existing bookings for this route and date
    const existingBookings = await bookingService.getBookingsForRoute(routeId, date);
    console.log(`Found ${existingBookings.length} existing bookings for route ${routeId}`);
    
    let usedWeight = 0;
    let usedVolume = 0;
    let usedParcels = 0;
    
    existingBookings.forEach(booking => {
      if (booking.items && Array.isArray(booking.items)) {
        booking.items.forEach(item => {
          usedWeight += parseFloat(item.weight) || 0;
          usedParcels += parseInt(item.quantity) || 0;
          if (item.dimensions && item.dimensions.length && item.dimensions.width && item.dimensions.height) {
            const volume = (parseFloat(item.dimensions.length) * parseFloat(item.dimensions.width) * parseFloat(item.dimensions.height)) / 1000000;
            usedVolume += volume * (parseInt(item.quantity) || 1);
          }
        });
      }
    });
    
    const capacityData = {
      capacity: {
        maxWeight: route.max_weight,
        maxVolume: route.max_volume,
        maxParcels: route.max_parcels
      },
      used: {
        weight: usedWeight,
        volume: usedVolume,
        parcels: usedParcels
      },
      available: {
        weight: Math.max(0, route.max_weight - usedWeight),
        volume: Math.max(0, route.max_volume - usedVolume),
        parcels: Math.max(0, route.max_parcels - usedParcels)
      },
      utilizationPercentage: {
        weight: route.max_weight > 0 ? (usedWeight / route.max_weight) * 100 : 0,
        volume: route.max_volume > 0 ? (usedVolume / route.max_volume) * 100 : 0,
        parcels: route.max_parcels > 0 ? (usedParcels / route.max_parcels) * 100 : 0
      }
    };
    
    console.log('Capacity data:', capacityData);
    res.json(capacityData);
  } catch (error) {
    console.error('Get capacity error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
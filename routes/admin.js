const express = require('express');
const { 
  authMiddleware, 
  requireRole, 
  requirePermission, 
  sensitiveOperationLimiter,
  sanitizeResponse 
} = require('../middleware/auth');
const routeService = require('../services/routeService');
const bookingService = require('../services/bookingService');
const quoteService = require('../services/quoteService');

const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

// Dashboard stats - requires view_dashboard permission
router.get('/dashboard', 
  requirePermission(['view_dashboard']),
  async (req, res) => {
    try {
      const bookingStats = await bookingService.getDashboardStats();
      const quoteStats = await quoteService.getDashboardStats();
      const routes = await routeService.getAllRoutes(true);
      const incomeAnalytics = await bookingService.getIncomeAnalytics(req.user.role);
      
      const stats = {
        todayBookings: bookingStats.todayBookings,
        pendingQuotes: quoteStats.pendingQuotes,
        activeBookings: bookingStats.activeBookings,
        totalRoutes: routes.length,
        userRole: req.user.role,
        lastAccess: new Date().toISOString(),
        income: incomeAnalytics
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Route management - requires view_routes permission
router.get('/routes', 
  requirePermission(['view_routes']),
  sanitizeResponse(['_id', 'routeCode', 'name', 'origin', 'destination', 'schedule', 'capacity', 'pricing', 'isActive', 'cutoffHours', 'createdAt']),
  async (req, res) => {
  try {
    const routes = await routeService.getAllRoutes();
    
    // Format routes for admin consumption
    const formattedRoutes = routes.map(route => ({
      _id: route.id,
      routeCode: route.route_code,
      name: route.name,
      origin: {
        city: route.origin_city,
        address: route.origin_address,
        coordinates: {
          lat: route.origin_lat,
          lng: route.origin_lng
        }
      },
      destination: {
        city: route.destination_city,
        address: route.destination_address,
        coordinates: {
          lat: route.destination_lat,
          lng: route.destination_lng
        }
      },
      schedule: {
        frequency: route.frequency,
        departureTime: route.departure_time,
        estimatedDuration: route.estimated_duration
      },
      capacity: {
        maxWeight: route.max_weight,
        maxVolume: route.max_volume,
        maxParcels: route.max_parcels
      },
      pricing: {
        baseRate: route.base_rate,
        perKgRate: route.per_kg_rate,
        perCubicMeterRate: route.per_cubic_meter_rate
      },
      isActive: route.is_active,
      cutoffHours: route.cutoff_hours,
      createdAt: route.created_at
    }));
    
    res.json(formattedRoutes);
  } catch (error) {
    console.error('Get admin routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/routes', 
  requirePermission(['create_routes']),
  sensitiveOperationLimiter,
  async (req, res) => {
  try {
    const route = await routeService.createRoute(req.body);
    res.status(201).json(route);
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/routes/:id', 
  requirePermission(['edit_routes']),
  sensitiveOperationLimiter,
  async (req, res) => {
  try {
    const route = await routeService.updateRoute(req.params.id, req.body);
    res.json(route);
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Booking management - requires view_all_bookings permission
router.get('/bookings', 
  requirePermission(['view_all_bookings']),
  async (req, res) => {
  try {
    const { page = 1, limit = 20, status, serviceType } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (serviceType) filters.serviceType = serviceType;
    
    const result = await bookingService.getBookings(filters, parseInt(page), parseInt(limit));
    
    // Format bookings for admin consumption
    const formattedBookings = result.bookings.map(booking => ({
      _id: booking.id,
      bookingReference: booking.booking_reference,
      serviceType: booking.service_type,
      customer: {
        name: booking.customer_name,
        email: booking.customer_email,
        phone: booking.customer_phone,
        company: booking.customer_company
      },
      pickup: {
        city: booking.pickup_city,
        address: booking.pickup_address,
        date: booking.pickup_date
      },
      delivery: {
        city: booking.delivery_city,
        address: booking.delivery_address,
        date: booking.delivery_date
      },
      status: booking.status,
      items: booking.items,
      pricing: booking.pricing,
      createdAt: booking.created_at,
      route: booking.routes
    }));
    
    res.json({
      bookings: formattedBookings,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      total: result.total
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status - requires update_booking_status permission
router.put('/bookings/:id/status', 
  requirePermission(['update_booking_status']),
  sensitiveOperationLimiter,
  async (req, res) => {
  try {
    const { status, location, notes } = req.body;
    
    // Get current booking to validate status progression
    const currentBooking = await bookingService.getBookingById(req.params.id);
    
    // Validate status progression
    const validation = bookingService.validateStatusProgression(
      currentBooking.status, 
      status, 
      req.user.role
    );
    
    if (!validation.valid) {
      return res.status(400).json({ 
        message: validation.message,
        code: 'INVALID_STATUS_PROGRESSION'
      });
    }
    
    const booking = await bookingService.updateBookingStatus(
      req.params.id,
      { status, location, notes },
      req.user.userId
    );
    
    res.json(booking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create courier shipment - requires create_courier_shipments permission
router.post('/courier-shipments', 
  requirePermission(['create_courier_shipments']),
  async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      serviceType: 'courier'
    };
    
    const booking = await bookingService.createBooking(bookingData);
    
    res.status(201).json({
      bookingReference: booking.booking_reference,
      status: booking.status
    });
  } catch (error) {
    console.error('Create courier shipment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Quote management - requires view_all_quotes permission
router.get('/quotes', 
  requirePermission(['view_all_quotes']),
  sanitizeResponse(['_id', 'quoteReference', 'serviceType', 'customer', 'origin', 'destination', 'items', 'estimatedPrice', 'status', 'createdAt', 'processedBy']),
  async (req, res) => {
  try {
    const quotes = await quoteService.getAllQuotes();
    
    // Format quotes for admin consumption
    const formattedQuotes = quotes.map(quote => ({
      _id: quote.id,
      quoteReference: quote.quote_reference,
      serviceType: quote.service_type,
      customer: {
        name: quote.customer_name,
        email: quote.customer_email,
        phone: quote.customer_phone,
        company: quote.customer_company
      },
      origin: {
        city: quote.origin_city,
        address: quote.origin_address
      },
      destination: {
        city: quote.destination_city,
        address: quote.destination_address
      },
      items: quote.items,
      estimatedPrice: quote.estimated_price,
      status: quote.status,
      createdAt: quote.created_at,
      processedBy: quote.users
    }));
    
    res.json(formattedQuotes);
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/quotes/:id', 
  requirePermission(['process_quotes']),
  sensitiveOperationLimiter,
  async (req, res) => {
  try {
    const quote = await quoteService.updateQuote(req.params.id, req.body, req.user.userId);
    res.json(quote);
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
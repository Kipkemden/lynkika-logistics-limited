const express = require('express');
const { logger, logPerformance, logBusinessEvent } = require('../config/logger');
const router = express.Router();

// Performance metrics endpoint
router.post('/performance', async (req, res) => {
  try {
    const {
      name,
      value,
      timestamp,
      url,
      userAgent,
      metadata
    } = req.body;

    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';

    // Log performance metric
    logPerformance(name, value, {
      url,
      userAgent,
      clientIP,
      timestamp,
      ...metadata
    });

    // Alert on poor performance
    const performanceThresholds = {
      'LCP': 2500, // 2.5 seconds
      'FID': 100,  // 100ms
      'CLS': 0.1,  // 0.1
      'Page_Load_Time': 3000, // 3 seconds
      'API_Response_Time': 1000 // 1 second
    };

    if (performanceThresholds[name] && value > performanceThresholds[name]) {
      logger.warn('Performance Alert', {
        metric: name,
        value,
        threshold: performanceThresholds[name],
        url,
        clientIP,
        severity: 'HIGH'
      });
    }

    res.status(200).json({ message: 'Metric recorded', success: true });

  } catch (error) {
    logger.error('Failed to record performance metric', {
      error: error.message,
      stack: error.stack
    });
    
    // Return success even on error to prevent client-side retry loops
    res.status(200).json({ message: 'Metric received', success: false });
  }
});

// Business events endpoint
router.post('/events', async (req, res) => {
  try {
    const {
      event,
      properties
    } = req.body;

    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = req.user?.userId || properties?.userId || 'anonymous';

    // Log business event
    logBusinessEvent(event, userId, {
      ...properties,
      clientIP,
      userAgent: req.get('User-Agent')
    });

    // Track important business events
    const importantEvents = [
      'quote_requested',
      'booking_created',
      'payment_completed',
      'user_registered',
      'login_success',
      'service_booked',
      'page_view',
      'admin_login'
    ];

    if (importantEvents.includes(event)) {
      logger.info('Important Business Event', {
        event,
        userId,
        properties,
        clientIP,
        timestamp: new Date().toISOString(),
        priority: 'HIGH'
      });
    }

    res.status(200).json({ message: 'Event tracked', success: true });

  } catch (error) {
    logger.error('Failed to track event', {
      error: error.message,
      stack: error.stack
    });
    
    // Return success even on error to prevent client-side retry loops
    res.status(200).json({ message: 'Event received', success: false });
  }
});

module.exports = router;
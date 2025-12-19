const express = require('express');
const { logger, logSecurityEvent } = require('../config/logger');
const router = express.Router();

// Error logging endpoint
router.post('/', async (req, res) => {
  try {
    const {
      type,
      message,
      stack,
      componentStack,
      filename,
      lineno,
      colno,
      timestamp,
      url,
      userAgent,
      userId
    } = req.body;

    const clientIP = req.ip || req.connection.remoteAddress;

    // Log the frontend error
    logger.error('Frontend Error', {
      type,
      message,
      stack,
      componentStack,
      filename,
      lineno,
      colno,
      timestamp,
      url,
      userAgent,
      userId: userId || 'anonymous',
      clientIP
    });

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(message) || pattern.test(stack || '')
    );

    if (isSuspicious) {
      logSecurityEvent('SUSPICIOUS_FRONTEND_ERROR', userId, {
        message,
        stack,
        url,
        type
      }, clientIP, userAgent);
    }

    res.status(200).json({ 
      message: 'Error logged successfully',
      id: Date.now()
    });

  } catch (error) {
    logger.error('Failed to log frontend error', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      message: 'Failed to log error' 
    });
  }
});

module.exports = router;
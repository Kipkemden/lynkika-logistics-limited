const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const SECURITY_CONFIG = require('../config/security');
const securityService = require('../services/securityService');

// Enhanced security headers
const securityHeaders = helmet({
  contentSecurityPolicy: SECURITY_CONFIG.headers.contentSecurityPolicy,
  hsts: SECURITY_CONFIG.headers.hsts,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
});

// Input validation middleware
const validateInput = (req, res, next) => {
  // Validate email format if present
  if (req.body.email && !SECURITY_CONFIG.validation.email.test(req.body.email)) {
    return res.status(400).json({
      message: 'Invalid email format',
      code: 'VALIDATION_ERROR'
    });
  }

  // Validate phone format if present
  if (req.body.phone && !SECURITY_CONFIG.validation.phone.test(req.body.phone)) {
    return res.status(400).json({
      message: 'Invalid phone number format',
      code: 'VALIDATION_ERROR'
    });
  }

  // Sanitize string inputs to prevent XSS
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
  };

  // Recursively sanitize request body
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  sanitizeObject(req.body);
  next();
};

// Suspicious activity detection
const detectSuspiciousActivity = async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const suspiciousActivity = await securityService.detectSuspiciousActivity(clientIP);
    
    if (suspiciousActivity.isSuspicious) {
      console.warn(`[SECURITY] Suspicious activity detected from ${clientIP}:`, suspiciousActivity);
      
      await securityService.logSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        req.user?.userId || null,
        suspiciousActivity,
        clientIP,
        req.get('User-Agent')
      );

      return res.status(429).json({
        message: 'Suspicious activity detected. Access temporarily restricted.',
        code: 'SUSPICIOUS_ACTIVITY_DETECTED'
      });
    }
    
    next();
  } catch (error) {
    console.error('Suspicious activity detection error:', error);
    next(); // Continue on error to avoid blocking legitimate users
  }
};

// Request logging for audit trail
const auditLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Log sensitive operations
    const sensitiveEndpoints = ['/api/admin', '/api/auth'];
    const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
    
    if (isSensitive || res.statusCode >= 400) {
      const eventType = res.statusCode >= 400 ? 'ERROR_RESPONSE' : 'SENSITIVE_ACCESS';
      
      await securityService.logSecurityEvent(
        eventType,
        req.user?.userId || null,
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent')
        },
        clientIP,
        req.get('User-Agent')
      );
    }
  });
  
  next();
};

// Create rate limiters based on configuration
const createRateLimiter = (type) => {
  const config = SECURITY_CONFIG.rateLimiting[type];
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      message: config.message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    handler: async (req, res) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      await securityService.logSecurityEvent(
        'RATE_LIMIT_EXCEEDED',
        req.user?.userId || null,
        { limitType: type, path: req.path },
        clientIP,
        req.get('User-Agent')
      );
      
      res.status(429).json({
        message: config.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    }
  });
};

module.exports = {
  securityHeaders,
  validateInput,
  detectSuspiciousActivity,
  auditLogger,
  publicApiLimiter: createRateLimiter('public'),
  authLimiter: createRateLimiter('auth'),
  sensitiveOperationLimiter: createRateLimiter('sensitive')
};
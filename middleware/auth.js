const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const rateLimit = require('express-rate-limit');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userService.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Permission-based access control
const requirePermission = (requiredPermissions = []) => {
  const ROLE_PERMISSIONS = {
    'super_admin': [
      'view_dashboard', 'view_analytics', 'view_routes', 'create_routes', 'edit_routes', 
      'delete_routes', 'activate_deactivate_routes', 'view_all_bookings', 'create_bookings', 
      'edit_bookings', 'update_booking_status', 'cancel_bookings', 'assign_vehicles',
      'view_all_quotes', 'process_quotes', 'approve_quotes', 'view_users', 'create_users',
      'edit_users', 'delete_users', 'create_courier_shipments', 'view_pricing', 'edit_pricing',
      'view_financial_reports', 'view_system_logs', 'manage_system_settings'
    ],
    'operations_manager': [
      'view_dashboard', 'view_analytics', 'view_routes', 'create_routes', 'edit_routes',
      'activate_deactivate_routes', 'view_all_bookings', 'create_bookings', 'edit_bookings',
      'update_booking_status', 'cancel_bookings', 'assign_vehicles', 'view_all_quotes',
      'process_quotes', 'approve_quotes', 'create_courier_shipments', 'view_pricing',
      'edit_pricing', 'view_financial_reports'
    ],
    'dispatcher': [
      'view_dashboard', 'view_routes', 'view_all_bookings', 'create_bookings',
      'update_booking_status', 'assign_vehicles', 'create_courier_shipments', 'view_pricing'
    ]
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasPermission = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      console.warn(`[SECURITY] Permission denied for user ${req.user.email} (${req.user.role}) to ${req.path}. Required permissions: ${requiredPermissions.join(', ')}`);
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        requiredPermissions,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for sensitive operations
  message: {
    message: 'Too many sensitive operations, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public API rate limiting (more restrictive)
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for public APIs
  message: {
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Data sanitization middleware
const sanitizeResponse = (allowedFields = []) => {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      if (data && typeof data === 'object' && allowedFields.length > 0) {
        if (Array.isArray(data)) {
          data = data.map(item => sanitizeObject(item, allowedFields));
        } else {
          data = sanitizeObject(data, allowedFields);
        }
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

const sanitizeObject = (obj, allowedFields) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  allowedFields.forEach(field => {
    if (obj.hasOwnProperty(field)) {
      sanitized[field] = obj[field];
    }
  });
  return sanitized;
};

// Legacy support (deprecated)
const adminOnly = requireRole;

module.exports = { 
  authMiddleware, 
  requireRole, 
  requirePermission, 
  sensitiveOperationLimiter,
  publicApiLimiter,
  sanitizeResponse,
  adminOnly // deprecated, use requireRole instead
};
// Enterprise-grade security configuration for Lynkika Logistics

const SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    tokenExpiry: '2h', // Reduced from 8h for enterprise security
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 12,
    passwordRequireSpecialChars: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
  },

  // Rate limiting configuration
  rateLimiting: {
    // Public API endpoints
    public: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // requests per window
      message: 'Too many requests from this IP, please try again later.'
    },
    
    // Authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // login attempts per window
      skipSuccessfulRequests: true,
      message: 'Too many login attempts, please try again later.'
    },
    
    // Sensitive operations
    sensitive: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // operations per window
      message: 'Too many sensitive operations, please try again later.'
    }
  },

  // Role-based permissions matrix
  permissions: {
    super_admin: [
      'view_dashboard', 'view_analytics', 'view_routes', 'create_routes', 'edit_routes', 
      'delete_routes', 'activate_deactivate_routes', 'view_all_bookings', 'create_bookings', 
      'edit_bookings', 'update_booking_status', 'cancel_bookings', 'assign_vehicles',
      'view_all_quotes', 'process_quotes', 'approve_quotes', 'view_users', 'create_users',
      'edit_users', 'delete_users', 'create_courier_shipments', 'view_pricing', 'edit_pricing',
      'view_financial_reports', 'view_system_logs', 'manage_system_settings'
    ],
    operations_manager: [
      'view_dashboard', 'view_analytics', 'view_routes', 'create_routes', 'edit_routes',
      'activate_deactivate_routes', 'view_all_bookings', 'create_bookings', 'edit_bookings',
      'update_booking_status', 'cancel_bookings', 'assign_vehicles', 'view_all_quotes',
      'process_quotes', 'approve_quotes', 'create_courier_shipments', 'view_pricing',
      'edit_pricing', 'view_financial_reports'
    ],
    dispatcher: [
      'view_dashboard', 'view_routes', 'view_all_bookings', 'create_bookings',
      'update_booking_status', 'assign_vehicles', 'create_courier_shipments', 'view_pricing'
    ]
  },

  // Data sanitization rules
  sanitization: {
    // Public API responses - only expose necessary fields
    public: {
      quotes: ['quote_reference', 'service_type', 'status', 'estimated_price', 'valid_until', 'created_at'],
      bookings: ['booking_reference', 'service_type', 'status', 'pickup_city', 'delivery_city', 'pickup_date', 'delivery_date', 'created_at'],
      tracking: ['reference', 'serviceType', 'status', 'pickup', 'delivery', 'timeline'],
      routes: ['_id', 'routeCode', 'name', 'origin', 'destination', 'schedule', 'pricing'],
      capacity: ['available', 'utilizationPercentage']
    },
    
    // Admin API responses - more detailed but still controlled
    admin: {
      users: ['id', 'name', 'email', 'role', 'is_active', 'last_login', 'created_at'],
      routes: ['_id', 'routeCode', 'name', 'origin', 'destination', 'schedule', 'capacity', 'pricing', 'isActive', 'cutoffHours', 'createdAt'],
      quotes: ['_id', 'quoteReference', 'serviceType', 'customer', 'origin', 'destination', 'items', 'estimatedPrice', 'status', 'createdAt', 'processedBy'],
      bookings: ['_id', 'bookingReference', 'serviceType', 'customer', 'pickup', 'delivery', 'status', 'items', 'pricing', 'createdAt', 'route']
    }
  },

  // Security event types for audit logging
  auditEvents: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    DATA_ACCESS: 'DATA_ACCESS',
    DATA_MODIFICATION: 'DATA_MODIFICATION',
    USER_CREATED: 'USER_CREATED',
    USER_MODIFIED: 'USER_MODIFIED',
    ROUTE_CREATED: 'ROUTE_CREATED',
    ROUTE_MODIFIED: 'ROUTE_MODIFIED',
    BOOKING_CREATED: 'BOOKING_CREATED',
    BOOKING_MODIFIED: 'BOOKING_MODIFIED'
  },

  // Security headers configuration
  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.lynkika.com"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  },

  // Input validation rules
  validation: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]{10,}$/,
    bookingReference: /^[A-Z]\d{6}[A-Z0-9]{3}$/,
    quoteReference: /^Q\d{6}[A-Z0-9]{3}$/,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf']
  }
};

module.exports = SECURITY_CONFIG;
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const morgan = require('morgan');
const expressWinston = require('express-winston');
require('dotenv').config();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger, logSecurityEvent, logPerformance } = require('./config/logger');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Request logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Express Winston logger for detailed request/response logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req, res) => false
}));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Enhanced compression with better settings
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.SUPABASE_URL]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Enhanced rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased from 100 to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900
  },
  skip: (req) => {
    // Skip rate limiting for health checks and development
    return req.path === '/health' || process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// Specific rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 900
  },
  skip: (req) => {
    // Skip in development
    return process.env.NODE_ENV === 'development';
  }
});

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://lynkika.co.ke', 'https://www.lynkika.co.ke'] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test Supabase connection
const supabase = require('./config/supabase');
console.log('Supabase client initialized');

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/monitoring', require('./routes/monitoring'));
app.use('/api/security', require('./routes/security'));
app.use('/api/errors', require('./routes/errors'));
app.use('/api/analytics', require('./routes/analytics'));

// Serve static files in production with caching
if (process.env.NODE_ENV === 'production') {
  // Static file caching
  app.use(express.static('client/build', {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Different cache strategies for different file types
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (path.match(/\.(js|css)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (path.match(/\.(png|jpg|jpeg|gif|ico|svg)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Enhanced error handling middleware
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

app.use((err, req, res, next) => {
  // Log the error with context
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous'
  });

  // Security event for suspicious errors
  if (err.message.includes('SQL') || err.message.includes('injection')) {
    logSecurityEvent('POTENTIAL_SQL_INJECTION', req.user?.userId, {
      error: err.message,
      url: req.url
    }, req.ip, req.get('User-Agent'));
  }

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({ 
    message,
    requestId: req.id || Date.now()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.status(200).json(healthCheck);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Lynkika Logistics Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server Error', { error: error.message, stack: error.stack });
});
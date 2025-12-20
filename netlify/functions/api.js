const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const compression = require('compression');

const app = express();

// Configure serverless-http to handle base path properly
const serverlessHandler = serverless(app, {
  basePath: '/api'
});

// Basic middleware
app.use(compression());
app.use(cors({
  origin: ['https://lynkika.netlify.app', 'https://lynkika.co.ke', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase with error handling
let supabaseInitialized = false;
try {
  const supabase = require('../../config/supabase');
  console.log('Supabase client initialized');
  supabaseInitialized = true;
} catch (error) {
  console.error('Supabase initialization failed:', error);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Netlify function is running',
    supabaseInitialized,
    timestamp: new Date().toISOString()
  });
});

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Original: ${req.originalUrl}`);
  next();
});

// Load all routes with better error handling
const routes = [
  { path: '/auth', file: '../../routes/auth', name: 'auth' },
  { path: '/quotes', file: '../../routes/quotes', name: 'quotes' },
  { path: '/bookings', file: '../../routes/bookings', name: 'bookings' },
  { path: '/tracking', file: '../../routes/tracking', name: 'tracking' },
  { path: '/routes', file: '../../routes/routes', name: 'routes' },
  { path: '/admin', file: '../../routes/admin', name: 'admin' },
  { path: '/admin/monitoring', file: '../../routes/monitoring', name: 'monitoring' },
  { path: '/security', file: '../../routes/security', name: 'security' },
  { path: '/errors', file: '../../routes/errors', name: 'errors' },
  { path: '/analytics', file: '../../routes/analytics', name: 'analytics' }
];

routes.forEach(route => {
  try {
    const router = require(route.file);
    app.use(route.path, router);
    console.log(`✓ Loaded ${route.name} route`);
  } catch (error) {
    console.error(`✗ Failed to load ${route.name} route:`, error.message);
    app.use(route.path, (req, res) => {
      res.status(500).json({ 
        message: `${route.name} service temporarily unavailable`,
        error: error.message
      });
    });
  }
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    status: 'Server running',
    supabaseInitialized,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method,
    availableRoutes: routes.map(r => r.path)
  });
});

// Handle root path requests (GET only)
app.get('/', (req, res) => {
  res.json({
    message: 'Lynkika Logistics API',
    status: 'running',
    availableRoutes: routes.map(r => r.path),
    receivedPath: req.path,
    receivedMethod: req.method,
    originalUrl: req.originalUrl
  });
});

// Catch all for debugging
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    method: req.method,
    originalUrl: req.originalUrl,
    availableRoutes: routes.map(r => r.path)
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    path: req.path
  });
});

module.exports.handler = serverlessHandler;
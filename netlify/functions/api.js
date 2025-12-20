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
let supabaseError = null;
try {
  const supabase = require('../../config/supabase');
  console.log('✅ Supabase client initialized successfully');
  supabaseInitialized = true;
} catch (error) {
  console.error('❌ Supabase initialization failed:', error.message);
  console.error('Stack:', error.stack);
  supabaseError = error.message;
  supabaseInitialized = false;
}

// Health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  const healthData = { 
    status: 'OK', 
    message: 'Netlify function is running',
    supabaseInitialized,
    supabaseError: supabaseError || null,
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  };
  console.log('🏥 Health check response:', healthData);
  res.json(healthData);
});

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Original: ${req.originalUrl}`);
  console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📥 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Load all routes with better error handling
const path = require('path');
const routes = [
  { path: '/auth', file: path.join(__dirname, '../../routes/auth'), name: 'auth' },
  { path: '/quotes', file: path.join(__dirname, '../../routes/quotes'), name: 'quotes' },
  { path: '/bookings', file: path.join(__dirname, '../../routes/bookings'), name: 'bookings' },
  { path: '/tracking', file: path.join(__dirname, '../../routes/tracking'), name: 'tracking' },
  { path: '/routes', file: path.join(__dirname, '../../routes/routes'), name: 'routes' },
  { path: '/admin', file: path.join(__dirname, '../../routes/admin'), name: 'admin' },
  { path: '/admin/monitoring', file: path.join(__dirname, '../../routes/monitoring'), name: 'monitoring' },
  { path: '/security', file: path.join(__dirname, '../../routes/security'), name: 'security' },
  { path: '/errors', file: path.join(__dirname, '../../routes/errors'), name: 'errors' },
  { path: '/analytics', file: path.join(__dirname, '../../routes/analytics'), name: 'analytics' }
];

routes.forEach(route => {
  try {
    console.log(`🔍 Attempting to load ${route.name} from: ${route.file}`);
    const router = require(route.file);
    app.use(route.path, router);
    console.log(`✅ Loaded ${route.name} route successfully`);
  } catch (error) {
    console.error(`❌ Failed to load ${route.name} route:`, error.message);
    console.error(`❌ File path attempted: ${route.file}`);
    console.error(`❌ __dirname: ${__dirname}`);
    console.error(`❌ Stack trace:`, error.stack);
    app.use(route.path, (req, res) => {
      console.error(`🚨 ${route.name} service error for ${req.method} ${req.path}`);
      res.status(500).json({ 
        message: `${route.name} service temporarily unavailable`,
        error: error.message,
        timestamp: new Date().toISOString()
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
  console.error('🔥 Server error:', err);
  console.error('🔥 Stack:', err.stack);
  console.error('🔥 Path:', req.path);
  console.error('🔥 Method:', req.method);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

module.exports.handler = serverlessHandler;
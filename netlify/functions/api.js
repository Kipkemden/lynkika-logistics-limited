const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const compression = require('compression');

const app = express();

// Basic middleware
app.use(compression());
app.use(cors());
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

// Handle Netlify path routing - Netlify strips paths, so we use originalUrl
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path} - Original: ${req.originalUrl}`);
  
  // Netlify strips the path, so we need to reconstruct it from originalUrl
  if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
    const apiPath = req.originalUrl.replace('/api', '');
    req.url = apiPath || '/';
    req.path = apiPath || '/';
    console.log(`Reconstructed path: ${req.path}`);
  }
  
  next();
});

// Handle quotes POST requests directly using originalUrl
app.use((req, res, next) => {
  if (req.method === 'POST' && req.originalUrl === '/api/quotes') {
    console.log('Direct quotes POST handler triggered');
    return res.json({
      message: 'Direct quotes endpoint reached!',
      path: req.path,
      method: req.method,
      originalUrl: req.originalUrl,
      body: req.body ? 'Body received' : 'No body'
    });
  }
  next();
});

// Test quotes endpoint - this should catch POST /quotes
app.post('/quotes', (req, res) => {
  res.json({
    message: 'Test quotes endpoint reached!',
    path: req.path,
    method: req.method,
    originalUrl: req.originalUrl,
    body: req.body ? 'Body received' : 'No body'
  });
});

// Load routes with better error handling
try {
  const quotesRouter = require('../../routes/quotes');
  app.use('/quotes', quotesRouter);
  console.log('✓ Loaded quotes route');
} catch (error) {
  console.error('✗ Failed to load quotes route:', error);
  app.use('/quotes', (req, res) => {
    res.status(500).json({ 
      message: 'Quotes service temporarily unavailable',
      error: error.message
    });
  });
}

try {
  const bookingsRouter = require('../../routes/bookings');
  app.use('/bookings', bookingsRouter);
  console.log('✓ Loaded bookings route');
} catch (error) {
  console.error('✗ Failed to load bookings route:', error);
  app.use('/bookings', (req, res) => {
    res.status(500).json({ 
      message: 'Bookings service temporarily unavailable',
      error: error.message
    });
  });
}

try {
  const trackingRouter = require('../../routes/tracking');
  app.use('/tracking', trackingRouter);
  console.log('✓ Loaded tracking route');
} catch (error) {
  console.error('✗ Failed to load tracking route:', error);
  app.use('/tracking', (req, res) => {
    res.status(500).json({ 
      message: 'Tracking service temporarily unavailable',
      error: error.message
    });
  });
}

try {
  const routesRouter = require('../../routes/routes');
  app.use('/routes', routesRouter);
  console.log('✓ Loaded routes route');
} catch (error) {
  console.error('✗ Failed to load routes route:', error);
}

try {
  const authRouter = require('../../routes/auth');
  app.use('/auth', authRouter);
  console.log('✓ Loaded auth route');
} catch (error) {
  console.error('✗ Failed to load auth route:', error);
}

try {
  const adminRouter = require('../../routes/admin');
  app.use('/admin', adminRouter);
  console.log('✓ Loaded admin route');
} catch (error) {
  console.error('✗ Failed to load admin route:', error);
}

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
    headers: req.headers,
    query: req.query
  });
});

// Add middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
  next();
});

// Handle root path requests (GET only)
app.get('/', (req, res) => {
  res.json({
    message: 'Lynkika Logistics API',
    status: 'running',
    availableRoutes: ['/quotes', '/bookings', '/tracking', '/routes', '/auth', '/admin', '/health', '/debug'],
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
    availableRoutes: ['/quotes', '/bookings', '/tracking', '/routes', '/auth', '/admin', '/health', '/debug']
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

module.exports.handler = serverless(app);
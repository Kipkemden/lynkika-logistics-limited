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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Initialize Supabase with error handling
let supabaseInitialized = false;
try {
  const supabase = require('../../config/supabase');
  console.log('Supabase client initialized');
  supabaseInitialized = true;
} catch (error) {
  console.error('Supabase initialization failed:', error);
}

// Load routes one by one with individual error handling
const routes = [
  { path: '/auth', file: '../../routes/auth' },
  { path: '/quotes', file: '../../routes/quotes' },
  { path: '/bookings', file: '../../routes/bookings' },
  { path: '/tracking', file: '../../routes/tracking' },
  { path: '/routes', file: '../../routes/routes' },
  { path: '/admin', file: '../../routes/admin' },
  { path: '/security', file: '../../routes/security' }
];

routes.forEach(({ path, file }) => {
  try {
    const router = require(file);
    app.use(path, router);
    console.log(`✓ Loaded route: ${path}`);
  } catch (error) {
    console.error(`✗ Failed to load route ${path}:`, error.message);
    // Create a fallback route for this path
    app.use(path, (req, res) => {
      res.status(500).json({ 
        message: `${path} temporarily unavailable`,
        error: `Route loading failed: ${error.message}`
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
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

module.exports.handler = serverless(app);
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();

// Basic middleware
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Try to load routes with error handling
try {
  // Test Supabase connection
  const supabase = require('../config/supabase');
  console.log('Supabase client initialized');

  // Load routes
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/quotes', require('../routes/quotes'));
  app.use('/api/bookings', require('../routes/bookings'));
  app.use('/api/tracking', require('../routes/tracking'));
  app.use('/api/routes', require('../routes/routes'));
  app.use('/api/admin', require('../routes/admin'));
  app.use('/api/security', require('../routes/security'));
} catch (error) {
  console.error('Error loading routes:', error);
  app.get('/api/*', (req, res) => {
    res.status(500).json({ 
      message: 'API temporarily unavailable', 
      error: error.message 
    });
  });
}

// Serve static files
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch all handler for React app
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  } catch (error) {
    res.status(500).json({ 
      message: 'Application temporarily unavailable',
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

module.exports = app;
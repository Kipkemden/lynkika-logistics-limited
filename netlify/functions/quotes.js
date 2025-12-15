const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase with error handling
try {
  const supabase = require('../../config/supabase');
  console.log('Supabase client initialized for quotes');
} catch (error) {
  console.error('Supabase initialization failed:', error);
}

// Load quotes route
try {
  const quotesRouter = require('../../routes/quotes');
  app.use('/', quotesRouter);
  console.log('✓ Loaded quotes route');
} catch (error) {
  console.error('✗ Failed to load quotes route:', error.message);
  app.use('/', (req, res) => {
    res.status(500).json({ 
      message: 'Quotes service temporarily unavailable',
      error: `Route loading failed: ${error.message}`
    });
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Quotes service error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

module.exports.handler = serverless(app);
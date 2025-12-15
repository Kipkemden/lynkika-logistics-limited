const express = require('express');
const path = require('path');

const app = express();

// Basic middleware
app.use(express.json());

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Minimal server is working',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

app.get('/api/env-check', (req, res) => {
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    envVarCount: Object.keys(process.env).length
  });
});

// Simple HTML response for root
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lynkika Logistics</title>
    </head>
    <body>
      <h1>Lynkika Logistics Server</h1>
      <p>Server is running successfully!</p>
      <ul>
        <li><a href="/api/test">Test API</a></li>
        <li><a href="/api/env-check">Environment Check</a></li>
      </ul>
    </body>
    </html>
  `);
});

// Catch all
app.get('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Server error',
    error: err.message
  });
});

module.exports = app;
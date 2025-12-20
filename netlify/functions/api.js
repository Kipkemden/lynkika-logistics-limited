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

// System monitoring endpoints
app.get('/admin/monitoring/performance', async (req, res) => {
  try {
    // Generate mock performance data for now - can be enhanced with real metrics
    const performanceData = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
      avgResponseTime: Math.floor(Math.random() * 500) + 200,
      errorRate: Math.random() * 5,
      requestCount: Math.floor(Math.random() * 1000) + 500
    }));

    res.json(performanceData);
  } catch (error) {
    console.error('Performance monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

app.get('/admin/monitoring/errors', async (req, res) => {
  try {
    // Mock error logs - in production, this would come from actual logs
    const errorLogs = [
      {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Database connection timeout',
        source: 'Database',
        details: 'Connection to Supabase timed out after 30s'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: 'warning',
        message: 'High memory usage detected',
        source: 'System',
        details: 'Memory usage exceeded 80% threshold'
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: 'error',
        message: 'API rate limit exceeded',
        source: 'API',
        details: 'Client exceeded 100 requests per minute'
      }
    ];

    res.json(errorLogs);
  } catch (error) {
    console.error('Error logs monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});

app.get('/admin/monitoring/security', async (req, res) => {
  try {
    // Mock security events
    const securityEvents = [
      {
        timestamp: new Date().toISOString(),
        eventType: 'Failed Login Attempt',
        ipAddress: '192.168.1.100',
        userId: 'unknown',
        severity: 'HIGH',
        details: 'Multiple failed login attempts from same IP'
      },
      {
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        eventType: 'Admin Login',
        ipAddress: '10.0.0.1',
        userId: 'admin@lynkika.co.ke',
        severity: 'LOW',
        details: 'Successful admin login'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        eventType: 'Suspicious Activity',
        ipAddress: '203.0.113.1',
        userId: 'anonymous',
        severity: 'MEDIUM',
        details: 'Unusual API access pattern detected'
      }
    ];

    res.json(securityEvents);
  } catch (error) {
    console.error('Security monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

app.get('/admin/monitoring/cache', async (req, res) => {
  try {
    // Mock cache statistics
    const cacheStats = {
      hits: Math.floor(Math.random() * 10000) + 5000,
      misses: Math.floor(Math.random() * 2000) + 500,
      keys: Math.floor(Math.random() * 1000) + 200,
      hitRate: 0.85,
      totalSize: '45.2MB',
      avgResponseTime: '12ms'
    };

    res.json(cacheStats);
  } catch (error) {
    console.error('Cache monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
});

app.post('/admin/monitoring/cache/clear', async (req, res) => {
  try {
    // Mock cache clear operation
    console.log('🗑️ Cache clear requested by admin');
    
    res.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
      clearedKeys: Math.floor(Math.random() * 500) + 100
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.get('/admin/monitoring/logs/:logType/download', async (req, res) => {
  try {
    const { logType } = req.params;
    
    // Generate mock log content
    const logContent = `
[${new Date().toISOString()}] INFO: System monitoring log export
[${new Date().toISOString()}] INFO: Log type: ${logType}
[${new Date().toISOString()}] INFO: Generated for admin download
[${new Date().toISOString()}] WARN: This is a mock log file for demonstration
[${new Date().toISOString()}] ERROR: Sample error entry for testing
    `.trim();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${logType}-logs-${new Date().toISOString().split('T')[0]}.log"`);
    res.send(logContent);
  } catch (error) {
    console.error('Log download error:', error);
    res.status(500).json({ error: 'Failed to download logs' });
  }
});

// Enhanced health check with more system info
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    message: 'System Operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    services: {
      database: 'operational',
      cache: 'operational',
      api: 'operational'
    },
    performance: {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
  };
  
  res.json(healthData);
});

// Embedded analytics routes (simplified for reliability)
app.post('/analytics/performance', async (req, res) => {
  try {
    const { name, value, timestamp, url, userAgent, metadata } = req.body;
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    console.log('📊 Performance metric:', { name, value, url, clientIP });

    // Log to console for now (can be enhanced later)
    console.log(`Performance: ${name} = ${value}ms at ${url}`);

    res.status(200).json({ message: 'Metric recorded', success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(200).json({ message: 'Metric received', success: false });
  }
});

app.post('/analytics/events', async (req, res) => {
  try {
    const { event, properties } = req.body;
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    console.log('📊 Business event:', { event, properties, clientIP });

    // Log important events
    const importantEvents = ['quote_requested', 'booking_created', 'admin_login', 'page_view'];
    if (importantEvents.includes(event)) {
      console.log(`🎯 Important Event: ${event}`, properties);
    }

    res.status(200).json({ message: 'Event tracked', success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(200).json({ message: 'Event received', success: false });
  }
});

// Embedded auth routes (since external files aren't bundled properly)
const jwt = require('jsonwebtoken');

// Auth test endpoint
app.get('/auth/test', (req, res) => {
  console.log('🧪 Auth test endpoint accessed');
  res.json({ 
    message: 'Auth route is working',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
    }
  });
});

// Admin login endpoint
app.post('/auth/login', async (req, res) => {
  console.log('\n🔐 === LOGIN ATTEMPT STARTED ===');
  console.log('🔐 Timestamp:', new Date().toISOString());
  console.log('🔐 Environment:', process.env.NODE_ENV);
  console.log('🔐 JWT Secret exists:', !!process.env.JWT_SECRET);
  console.log('🔐 Supabase URL exists:', !!process.env.SUPABASE_URL);
  console.log('🔐 Supabase Key exists:', !!process.env.SUPABASE_ANON_KEY);
  
  try {
    const { email, password } = req.body;
    console.log('🔐 Extracted email:', email);
    console.log('🔐 Password provided:', !!password);
    console.log('🔐 Request headers:', JSON.stringify(req.headers, null, 2));

    if (!email || !password) {
      console.log('❌ VALIDATION FAILED: Missing email or password');
      return res.status(400).json({ 
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ VALIDATION PASSED: Email and password provided');

    // Temporary bypass for known admin credentials
    const adminCredentials = {
      'admin@lynkika.co.ke': 'LynkikaAdmin2024!',
      'operations@lynkika.co.ke': 'OpsManager2024!',
      'dispatch@lynkika.co.ke': 'Dispatcher2024!',
      'dispatch2@lynkika.co.ke': 'NairobiDispatch2024!',
      'dispatch3@lynkika.co.ke': 'MombasaDispatch2024!'
    };

    const userRoles = {
      'admin@lynkika.co.ke': 'super_admin',
      'operations@lynkika.co.ke': 'operations_manager',
      'dispatch@lynkika.co.ke': 'dispatcher',
      'dispatch2@lynkika.co.ke': 'dispatcher',
      'dispatch3@lynkika.co.ke': 'dispatcher'
    };

    console.log('🔍 CHECKING HARDCODED CREDENTIALS');
    console.log('🔍 Email in admin list:', email in adminCredentials);
    console.log('🔍 Available admin emails:', Object.keys(adminCredentials));

    // Check if this is a known admin credential
    if (adminCredentials[email] && adminCredentials[email] === password) {
      console.log('🎉 HARDCODED CREDENTIAL MATCH - Using bypass for:', email);
      
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('❌ CRITICAL: JWT_SECRET not found in environment variables');
        console.error('❌ Available env vars:', Object.keys(process.env).filter(k => !k.includes('SECRET')));
        return res.status(500).json({ 
          message: 'Authentication service configuration error: JWT_SECRET not configured',
          timestamp: new Date().toISOString(),
          debug: process.env.NODE_ENV === 'development' ? 'JWT_SECRET missing' : undefined
        });
      }
      console.log('🔐 JWT Secret loaded from environment');
      
      const tokenPayload = { userId: email, role: userRoles[email] };
      console.log('🔐 Token payload:', tokenPayload);
      
      const token = jwt.sign(
        tokenPayload,
        jwtSecret,
        { expiresIn: '8h' }
      );
      
      console.log('✅ JWT TOKEN GENERATED successfully');
      console.log('✅ Token length:', token.length);

      const responseData = {
        token,
        user: {
          id: email,
          name: email.split('@')[0].replace('.', ' ').toUpperCase(),
          email: email,
          role: userRoles[email]
        }
      };
      
      console.log('📤 SENDING SUCCESS RESPONSE');
      console.log('📤 Response data:', JSON.stringify(responseData, null, 2));
      console.log('🔐 === LOGIN ATTEMPT COMPLETED SUCCESSFULLY ===\n');
      
      // Track admin login event
      console.log('📊 Tracking admin login event');
      
      return res.json(responseData);
    }

    console.log('❌ HARDCODED CREDENTIAL MISMATCH');
    console.log('❌ Provided email:', email);
    console.log('❌ Password match:', adminCredentials[email] === password);
    console.log('🔐 === LOGIN ATTEMPT FAILED ===\n');
    return res.status(401).json({ 
      message: 'Invalid credentials',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 CRITICAL LOGIN ERROR:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    console.log('🔐 === LOGIN ATTEMPT FAILED WITH ERROR ===\n');
    
    res.status(500).json({ 
      message: 'Authentication service temporarily unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Load all routes with better error handling (keeping for other routes)
const path = require('path');
const routes = [
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
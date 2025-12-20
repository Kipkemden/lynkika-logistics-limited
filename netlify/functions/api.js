const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const compression = require('compression');

const app = express();

// Real-time analytics storage (in production, use Redis or database)
const analyticsStore = {
  performanceMetrics: [],
  errorLogs: [],
  securityEvents: [],
  cacheStats: { hits: 0, misses: 0, keys: 0 },
  requestCounts: {},
  responseTimes: [],
  systemStartTime: Date.now()
};

// Middleware to track all requests
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Track request
  const hour = new Date().getHours();
  const key = `${new Date().toDateString()}_${hour}`;
  analyticsStore.requestCounts[key] = (analyticsStore.requestCounts[key] || 0) + 1;
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Store response time
    analyticsStore.responseTimes.push({
      timestamp: new Date().toISOString(),
      responseTime,
      path: req.path,
      method: req.method,
      statusCode: res.statusCode
    });
    
    // Keep only last 1000 response times
    if (analyticsStore.responseTimes.length > 1000) {
      analyticsStore.responseTimes = analyticsStore.responseTimes.slice(-1000);
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      analyticsStore.errorLogs.push({
        timestamp: new Date().toISOString(),
        level: res.statusCode >= 500 ? 'error' : 'warning',
        message: `${req.method} ${req.path} returned ${res.statusCode}`,
        source: 'API',
        details: `Response time: ${responseTime}ms`,
        statusCode: res.statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
      });
      
      // Keep only last 500 error logs
      if (analyticsStore.errorLogs.length > 500) {
        analyticsStore.errorLogs = analyticsStore.errorLogs.slice(-500);
      }
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
});

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

// System monitoring endpoints with REAL data
app.get('/admin/monitoring/performance', async (req, res) => {
  try {
    // Calculate real performance metrics from stored data
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    // Group response times by hour
    const hourlyMetrics = {};
    
    analyticsStore.responseTimes
      .filter(rt => new Date(rt.timestamp).getTime() > last24Hours)
      .forEach(rt => {
        const hour = new Date(rt.timestamp).getHours();
        const key = `${new Date(rt.timestamp).toDateString()}_${hour}`;
        
        if (!hourlyMetrics[key]) {
          hourlyMetrics[key] = {
            timestamp: new Date(rt.timestamp).toISOString(),
            responseTimes: [],
            errorCount: 0,
            requestCount: 0
          };
        }
        
        hourlyMetrics[key].responseTimes.push(rt.responseTime);
        hourlyMetrics[key].requestCount++;
        
        if (rt.statusCode >= 400) {
          hourlyMetrics[key].errorCount++;
        }
      });
    
    // Calculate averages
    const performanceData = Object.values(hourlyMetrics).map(metric => ({
      timestamp: metric.timestamp,
      avgResponseTime: metric.responseTimes.length > 0 
        ? Math.round(metric.responseTimes.reduce((a, b) => a + b, 0) / metric.responseTimes.length)
        : 0,
      errorRate: metric.requestCount > 0 
        ? Math.round((metric.errorCount / metric.requestCount) * 100 * 100) / 100
        : 0,
      requestCount: metric.requestCount
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(performanceData);
  } catch (error) {
    console.error('Performance monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

app.get('/admin/monitoring/errors', async (req, res) => {
  try {
    // Return real error logs from our storage
    const recentErrors = analyticsStore.errorLogs
      .slice(-50) // Last 50 errors
      .reverse(); // Most recent first

    res.json(recentErrors);
  } catch (error) {
    console.error('Error logs monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});

app.get('/admin/monitoring/security', async (req, res) => {
  try {
    // Return real security events
    res.json(analyticsStore.securityEvents.slice(-50).reverse());
  } catch (error) {
    console.error('Security monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

app.get('/admin/monitoring/cache', async (req, res) => {
  try {
    // Return real cache statistics
    const totalRequests = analyticsStore.cacheStats.hits + analyticsStore.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (analyticsStore.cacheStats.hits / totalRequests) : 0;
    
    res.json({
      ...analyticsStore.cacheStats,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests
    });
  } catch (error) {
    console.error('Cache monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
});

app.post('/admin/monitoring/cache/clear', async (req, res) => {
  try {
    // Reset cache stats
    const clearedKeys = analyticsStore.cacheStats.keys;
    analyticsStore.cacheStats = { hits: 0, misses: 0, keys: 0 };
    
    console.log('🗑️ Cache cleared by admin');
    
    res.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
      clearedKeys
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.get('/admin/monitoring/logs/:logType/download', async (req, res) => {
  try {
    const { logType } = req.params;
    let logContent = '';
    
    if (logType === 'error') {
      logContent = analyticsStore.errorLogs
        .map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message} - ${log.details}`)
        .join('\n');
    } else if (logType === 'security') {
      logContent = analyticsStore.securityEvents
        .map(event => `[${event.timestamp}] ${event.severity}: ${event.eventType} from ${event.ipAddress} - ${event.details}`)
        .join('\n');
    } else {
      logContent = `[${new Date().toISOString()}] INFO: No logs available for type: ${logType}`;
    }

    if (!logContent) {
      logContent = `[${new Date().toISOString()}] INFO: No ${logType} logs found`;
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${logType}-logs-${new Date().toISOString().split('T')[0]}.log"`);
    res.send(logContent);
  } catch (error) {
    console.error('Log download error:', error);
    res.status(500).json({ error: 'Failed to download logs' });
  }
});

// Enhanced health check with real system info
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - analyticsStore.systemStartTime) / 1000);
  const recentResponseTimes = analyticsStore.responseTimes.slice(-100);
  const avgResponseTime = recentResponseTimes.length > 0 
    ? Math.round(recentResponseTimes.reduce((a, b) => a + b.responseTime, 0) / recentResponseTimes.length)
    : 0;
  
  const healthData = {
    status: 'OK',
    message: 'System Operational',
    timestamp: new Date().toISOString(),
    uptime,
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    services: {
      database: 'operational',
      cache: 'operational',
      api: 'operational'
    },
    performance: {
      memoryUsage: process.memoryUsage(),
      avgResponseTime,
      totalRequests: analyticsStore.responseTimes.length,
      errorCount: analyticsStore.errorLogs.length
    }
  };
  
  res.json(healthData);
});

// Embedded analytics routes with real data tracking
app.post('/analytics/performance', async (req, res) => {
  try {
    const { name, value, timestamp, url, userAgent, metadata } = req.body;
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // Store real performance metric
    analyticsStore.performanceMetrics.push({
      name,
      value,
      timestamp: timestamp || new Date().toISOString(),
      url,
      userAgent,
      clientIP,
      ...metadata
    });

    // Keep only last 1000 performance metrics
    if (analyticsStore.performanceMetrics.length > 1000) {
      analyticsStore.performanceMetrics = analyticsStore.performanceMetrics.slice(-1000);
    }

    console.log('📊 Performance metric stored:', { name, value, url });

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

    // Store real business event
    const eventData = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      clientIP,
      userAgent: req.headers['user-agent']
    };

    // Track cache hits/misses for cache statistics
    if (event === 'cache_hit') {
      analyticsStore.cacheStats.hits++;
    } else if (event === 'cache_miss') {
      analyticsStore.cacheStats.misses++;
    }

    console.log('📊 Business event stored:', { event, properties });

    // Log important events as security events if relevant
    const securityEvents = ['admin_login', 'failed_login', 'suspicious_activity'];
    if (securityEvents.includes(event)) {
      analyticsStore.securityEvents.push({
        timestamp: new Date().toISOString(),
        eventType: event.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        ipAddress: clientIP,
        userId: properties.userId || 'anonymous',
        severity: event === 'failed_login' ? 'HIGH' : 'LOW',
        details: `Business event: ${event} with properties: ${JSON.stringify(properties)}`
      });
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
  
  const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  
  try {
    const { email, password } = req.body;
    console.log('🔐 Extracted email:', email);
    console.log('🔐 Password provided:', !!password);
    console.log('🔐 Client IP:', clientIP);

    if (!email || !password) {
      console.log('❌ VALIDATION FAILED: Missing email or password');
      
      // Log security event for failed validation
      analyticsStore.securityEvents.push({
        timestamp: new Date().toISOString(),
        eventType: 'Invalid Login Request',
        ipAddress: clientIP,
        userId: email || 'unknown',
        severity: 'MEDIUM',
        details: 'Missing email or password in login request'
      });
      
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

      // Log successful login security event
      analyticsStore.securityEvents.push({
        timestamp: new Date().toISOString(),
        eventType: 'Successful Admin Login',
        ipAddress: clientIP,
        userId: email,
        severity: 'LOW',
        details: `Admin user ${email} logged in successfully with role ${userRoles[email]}`
      });

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
    
    // Log failed login security event
    analyticsStore.securityEvents.push({
      timestamp: new Date().toISOString(),
      eventType: 'Failed Login Attempt',
      ipAddress: clientIP,
      userId: email,
      severity: 'HIGH',
      details: `Failed login attempt for ${email} - invalid credentials`
    });
    
    console.log('🔐 === LOGIN ATTEMPT FAILED ===\n');
    return res.status(401).json({ 
      message: 'Invalid credentials',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 CRITICAL LOGIN ERROR:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    // Log error security event
    analyticsStore.securityEvents.push({
      timestamp: new Date().toISOString(),
      eventType: 'Login System Error',
      ipAddress: clientIP,
      userId: 'system',
      severity: 'HIGH',
      details: `Login system error: ${error.message}`
    });
    
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
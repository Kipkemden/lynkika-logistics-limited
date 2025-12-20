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
const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const userService = require('../services/userService');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Auth-specific rate limiting - completely disabled in development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 900
  },
  skip: (req) => {
    // Always skip in development, only apply in production
    return process.env.NODE_ENV !== 'production';
  }
});

// Admin login - with database bypass for troubleshooting
router.post('/login', async (req, res) => {
  console.log('\n=== LOGIN ATTEMPT STARTED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV);
  console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
  
  try {
    const { email, password } = req.body;
    console.log('Extracted email:', email);
    console.log('Password provided:', !!password);

    if (!email || !password) {
      console.log('❌ VALIDATION FAILED: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
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
    console.log('Email in admin list:', email in adminCredentials);

    // Check if this is a known admin credential
    if (adminCredentials[email] && adminCredentials[email] === password) {
      console.log('🎉 HARDCODED CREDENTIAL MATCH - Using bypass for:', email);
      
      const jwtSecret = process.env.JWT_SECRET || 'LynkikaSecureJWT2024!ProductionKey';
      
      const tokenPayload = { userId: email, role: userRoles[email] };
      
      const token = jwt.sign(
        tokenPayload,
        jwtSecret,
        { expiresIn: '8h' }
      );
      
      console.log('✅ JWT TOKEN GENERATED successfully');

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
      console.log('=== LOGIN ATTEMPT COMPLETED SUCCESSFULLY ===\n');
      
      return res.json(responseData);
    }

    console.log('❌ HARDCODED CREDENTIAL MISMATCH');
    console.log('=== LOGIN ATTEMPT FAILED ===\n');
    return res.status(401).json({ message: 'Invalid credentials' });

  } catch (error) {
    console.error('💥 CRITICAL LOGIN ERROR:', error);
    console.log('=== LOGIN ATTEMPT FAILED WITH ERROR ===\n');
    
    res.status(500).json({ 
      message: 'Authentication service temporarily unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await userService.findById(req.user.userId);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test login endpoint for development and troubleshooting
router.post('/test-login', async (req, res) => {
  try {
    console.log('Test login endpoint accessed');
    
    // Return a test token
    const testToken = jwt.sign(
      { userId: '1', role: 'super_admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '8h' }
    );

    res.json({
      token: testToken,
      user: {
        id: '1',
        name: 'Test Admin',
        email: 'admin@lynkika.co.ke',
        role: 'super_admin'
      }
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (super admin only)
router.post('/users', authMiddleware, requireRole(['super_admin']), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await userService.createUser({ name, email, password, role });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
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
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Environment:', process.env.NODE_ENV);
  console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
  
  try {
    const { email, password } = req.body;
    console.log('Extracted email:', email);
    console.log('Password provided:', !!password);
    console.log('Password length:', password ? password.length : 0);

    if (!email || !password) {
      console.log('❌ VALIDATION FAILED: Missing email or password');
      console.log('Email missing:', !email);
      console.log('Password missing:', !password);
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
    console.log('Expected password for', email, ':', adminCredentials[email]);
    console.log('Provided password:', password);
    console.log('Passwords match:', adminCredentials[email] === password);

    // Check if this is a known admin credential
    if (adminCredentials[email] && adminCredentials[email] === password) {
      console.log('🎉 HARDCODED CREDENTIAL MATCH - Using bypass for:', email);
      
      const jwtSecret = process.env.JWT_SECRET || 'LynkikaSecureJWT2024!ProductionKey';
      console.log('JWT Secret being used:', jwtSecret.substring(0, 10) + '...');
      
      const tokenPayload = { userId: email, role: userRoles[email] };
      console.log('Token payload:', JSON.stringify(tokenPayload, null, 2));
      
      const token = jwt.sign(
        tokenPayload,
        jwtSecret,
        { expiresIn: '8h' }
      );
      
      console.log('✅ JWT TOKEN GENERATED successfully');
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 50) + '...');

      const responseData = {
        token,
        user: {
          id: email,
          name: email.split('@')[0].replace('.', ' ').toUpperCase(),
          email: email,
          role: userRoles[email]
        }
      };
      
      console.log('📤 SENDING SUCCESS RESPONSE:', JSON.stringify(responseData, null, 2));
      console.log('=== LOGIN ATTEMPT COMPLETED SUCCESSFULLY ===\n');
      
      return res.json(responseData);
    }

    console.log('❌ HARDCODED CREDENTIAL MISMATCH - Trying database...');

    // Try database lookup (with error handling)
    console.log('🔍 ATTEMPTING DATABASE LOOKUP...');
    try {
      const user = await userService.findByEmail(email);
      console.log('Database user found:', user ? 'Yes' : 'No');
      
      if (user) {
        console.log('Database user details:', JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          is_active: user.is_active
        }, null, 2));
      }
      
      if (!user) {
        console.log('❌ USER NOT FOUND in database for email:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('🔐 COMPARING PASSWORD...');
      const isMatch = await userService.comparePassword(password, user.password_hash);
      console.log('Password comparison result:', isMatch);
      
      if (!isMatch) {
        console.log('❌ PASSWORD MISMATCH for user:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('✅ PASSWORD MATCH - Updating last login...');
      await userService.updateLastLogin(user.id);

      console.log('🎫 GENERATING JWT TOKEN...');
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'LynkikaSecureJWT2024!ProductionKey',
        { expiresIn: '8h' }
      );

      console.log('✅ DATABASE LOGIN SUCCESSFUL for user:', email);
      console.log('=== LOGIN ATTEMPT COMPLETED SUCCESSFULLY ===\n');
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (dbError) {
      console.error('💥 DATABASE ERROR occurred:', dbError);
      console.error('Database error details:', {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });
      
      // Fallback to credential check if database fails
      console.log('🔄 DATABASE FAILED - Trying credential fallback...');
      if (adminCredentials[email] && adminCredentials[email] === password) {
        console.log('✅ DATABASE FAILED BUT CREDENTIAL FALLBACK WORKED for:', email);
        
        const token = jwt.sign(
          { userId: email, role: userRoles[email] },
          process.env.JWT_SECRET || 'LynkikaSecureJWT2024!ProductionKey',
          { expiresIn: '8h' }
        );

        console.log('=== LOGIN ATTEMPT COMPLETED WITH FALLBACK ===\n');
        return res.json({
          token,
          user: {
            id: email,
            name: email.split('@')[0].replace('.', ' ').toUpperCase(),
            email: email,
            role: userRoles[email]
          }
        });
      }
      
      console.log('❌ BOTH DATABASE AND FALLBACK FAILED');
      console.log('=== LOGIN ATTEMPT FAILED ===\n');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('💥 CRITICAL LOGIN ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.log('=== LOGIN ATTEMPT FAILED WITH ERROR ===\n');
    
    res.status(500).json({ 
      message: 'Server error',
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
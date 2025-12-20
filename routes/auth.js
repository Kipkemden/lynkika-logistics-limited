const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const userService = require('../services/userService');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Auth-specific rate limiting
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
    // Skip in development
    return process.env.NODE_ENV === 'development';
  }
});

// Admin login - with detailed debugging
router.post('/login', authLimiter, async (req, res) => {
  try {
    console.log('Login attempt received:', { email: req.body.email });
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Looking up user by email...');
    const user = await userService.findByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing password...');
    const isMatch = await userService.comparePassword(password, user.password_hash);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Updating last login...');
    await userService.updateLastLogin(user.id);

    console.log('Generating JWT token...');
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('Login successful for user:', email);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error stack:', error.stack);
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

// Test login endpoint for development
router.post('/test-login', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }

  try {
    // Return a test token for development
    const testToken = jwt.sign(
      { userId: 1, role: 'super_admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '8h' }
    );

    res.json({
      token: testToken,
      user: {
        id: 1,
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
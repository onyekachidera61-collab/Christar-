const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/jwt');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields required'
      });
    }

    // Check if user exists
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const userId = result.insertId;

    // Create wallet
    await pool.query(
      'INSERT INTO wallets (user_id, balance) VALUES (?, ?)',
      [userId, 0]
    );

    const token = generateToken({ id: userId, email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: userId, username, email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const [users] = await pool.query(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Refresh token
router.post('/refresh', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    const oldToken = require('jsonwebtoken').decode(token);
    if (oldToken) {
      const newToken = generateToken({ id: oldToken.id, email: oldToken.email });
      return res.json({
        success: true,
        token: newToken
      });
    }
  }

  res.json({
    success: true,
    token
  });
});

module.exports = router;

const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Middleware to check admin
const isAdmin = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.userId]
    );

    if (!users[0] || users[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin status'
    });
  }
};

// Dashboard
router.get('/dashboard', authenticate, isAdmin, async (req, res) => {
  try {
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [totalMatches] = await pool.query('SELECT COUNT(*) as count FROM matches');
    const [totalRevenue] = await pool.query(
      'SELECT SUM(platform_fee) as total FROM transactions WHERE type = ?',
      ['platform_fee']
    );

    res.json({
      success: true,
      dashboard: {
        totalUsers: totalUsers[0].count,
        totalMatches: totalMatches[0].count,
        totalRevenue: totalRevenue[0].total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard'
    });
  }
});

// Get withdrawals
router.get('/withdrawals', authenticate, isAdmin, async (req, res) => {
  try {
    const [withdrawals] = await pool.query(
      'SELECT w.*, u.username, u.email FROM withdrawals w JOIN users u ON w.user_id = u.id WHERE w.status = ? ORDER BY w.created_at DESC',
      ['pending']
    );

    res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching withdrawals'
    });
  }
});

// Approve withdrawal
router.post('/withdrawals/:withdrawalId/approve', authenticate, isAdmin, async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    await pool.query(
      'UPDATE withdrawals SET status = ? WHERE id = ?',
      ['approved', withdrawalId]
    );

    res.json({
      success: true,
      message: 'Withdrawal approved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving withdrawal'
    });
  }
});

module.exports = router;

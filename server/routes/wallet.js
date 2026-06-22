const express = require('express');
const { authenticate } = require('../middleware/auth');
const walletService = require('../services/walletService');
const pool = require('../config/database');

const router = express.Router();

// Get balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    const balance = await walletService.getBalance(req.userId);
    res.json({
      success: true,
      balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching balance'
    });
  }
});

// Get transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// Deposit
router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const result = await walletService.addFunds(
      req.userId,
      amount,
      'deposit',
      'User deposit'
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Deposit failed'
    });
  }
});

// Withdraw
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const balance = await walletService.getBalance(req.userId);
    if (balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create withdrawal request
    const [result] = await pool.query(
      'INSERT INTO withdrawals (user_id, amount, bank_details, status) VALUES (?, ?, ?, ?)',
      [req.userId, amount, JSON.stringify(bankDetails), 'pending']
    );

    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawalId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Withdrawal failed'
    });
  }
});

module.exports = router;

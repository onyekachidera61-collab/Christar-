const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, avatar } = req.body;

    const query = avatar
      ? 'UPDATE users SET username = ?, avatar = ? WHERE id = ?'
      : 'UPDATE users SET username = ? WHERE id = ?';

    const params = avatar
      ? [username, avatar, req.userId]
      : [username, req.userId];

    await pool.query(query, params);

    res.json({
      success: true,
      message: 'Profile updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Get user stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(DISTINCT m.match_id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.winner_id = ? THEN m.match_id END) as wins,
        SUM(CASE WHEN m.winner_id = ? THEN m.prize_amount ELSE 0 END) as total_winnings
      FROM matches m
      WHERE m.match_id IN (
        SELECT match_id FROM match_players WHERE user_id = ?
      )`,
      [req.userId, req.userId, req.userId]
    );

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const [leaderboard] = await pool.query(
      `SELECT 
        u.id, u.username, u.avatar,
        COUNT(DISTINCT m.match_id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.winner_id = u.id THEN m.match_id END) as wins,
        ROUND(COUNT(DISTINCT CASE WHEN m.winner_id = u.id THEN m.match_id END) * 100.0 / COUNT(DISTINCT m.match_id), 2) as win_rate
      FROM users u
      JOIN match_players mp ON u.id = mp.user_id
      JOIN matches m ON mp.match_id = m.match_id
      GROUP BY u.id
      ORDER BY wins DESC
      LIMIT 50`
    );

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard'
    });
  }
});

module.exports = router;

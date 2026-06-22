const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get tournaments
router.get('/', async (req, res) => {
  try {
    const [tournaments] = await pool.query(
      'SELECT * FROM tournaments WHERE status IN (?, ?) ORDER BY created_at DESC',
      ['active', 'waiting']
    );

    res.json({
      success: true,
      tournaments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tournaments'
    });
  }
});

// Get tournament details
router.get('/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const [tournaments] = await pool.query(
      'SELECT * FROM tournaments WHERE tournament_id = ?',
      [tournamentId]
    );

    if (tournaments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Get players
    const [players] = await pool.query(
      'SELECT user_id, status, ranking FROM tournament_players WHERE tournament_id = ?',
      [tournamentId]
    );

    res.json({
      success: true,
      tournament: tournaments[0],
      players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tournament'
    });
  }
});

// Join tournament
router.post('/:tournamentId/join', authenticate, async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const [tournaments] = await pool.query(
      'SELECT * FROM tournaments WHERE tournament_id = ?',
      [tournamentId]
    );

    if (tournaments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const tournament = tournaments[0];

    // Check if already joined
    const [existing] = await pool.query(
      'SELECT id FROM tournament_players WHERE tournament_id = ? AND user_id = ?',
      [tournamentId, req.userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already joined tournament'
      });
    }

    // Add to tournament
    await pool.query(
      'INSERT INTO tournament_players (tournament_id, user_id, status) VALUES (?, ?, ?)',
      [tournamentId, req.userId, 'active']
    );

    res.json({
      success: true,
      message: 'Joined tournament successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error joining tournament'
    });
  }
});

module.exports = router;

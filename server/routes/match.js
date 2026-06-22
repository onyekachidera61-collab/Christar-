const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Create match
router.post('/create', authenticate, async (req, res) => {
  try {
    const { type, playerCount, entryFee, isPrivate } = req.body;

    const matchId = uuidv4();
    const roomCode = Math.random().toString(36).substr(2, 8).toUpperCase();

    const [result] = await pool.query(
      'INSERT INTO matches (match_id, created_by, type, player_count, entry_fee, is_private, room_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [matchId, req.userId, type, playerCount, entryFee || 0, isPrivate || false, roomCode, 'waiting']
    );

    // Add creator to match
    await pool.query(
      'INSERT INTO match_players (match_id, user_id, joined_at) VALUES (?, ?, NOW())',
      [matchId, req.userId]
    );

    res.status(201).json({
      success: true,
      match: {
        matchId,
        roomCode,
        type,
        playerCount,
        entryFee
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating match'
    });
  }
});

// Get available matches
router.get('/available', async (req, res) => {
  try {
    const [matches] = await pool.query(
      'SELECT * FROM matches WHERE status = ? AND is_private = ? LIMIT 20',
      ['waiting', false]
    );

    res.json({
      success: true,
      matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching matches'
    });
  }
});

// Join match
router.post('/:matchId/join', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Check if match exists
    const [matches] = await pool.query(
      'SELECT * FROM matches WHERE match_id = ?',
      [matchId]
    );

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const match = matches[0];

    // Check if already joined
    const [existing] = await pool.query(
      'SELECT id FROM match_players WHERE match_id = ? AND user_id = ?',
      [matchId, req.userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already joined'
      });
    }

    // Add player to match
    await pool.query(
      'INSERT INTO match_players (match_id, user_id, joined_at) VALUES (?, ?, NOW())',
      [matchId, req.userId]
    );

    // Check if match is full
    const [players] = await pool.query(
      'SELECT COUNT(*) as count FROM match_players WHERE match_id = ?',
      [matchId]
    );

    if (players[0].count >= match.player_count) {
      await pool.query(
        'UPDATE matches SET status = ? WHERE match_id = ?',
        ['in_progress', matchId]
      );
    }

    res.json({
      success: true,
      message: 'Joined match successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error joining match'
    });
  }
});

module.exports = router;

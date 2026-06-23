const express = require('express');
const router = express.Router();
const { generateToken } = require('../utils/jwt');

// GET /api/guest/token?name=PlayerName
// Issues a signed JWT for a guest player so the /game Socket.IO namespace
// (which calls authenticateSocket → verifyToken) will accept the connection
// without requiring a real registration / login flow.
router.get('/token', (req, res) => {
  const name = String(req.query.name || 'Guest').trim().substring(0, 30) || 'Guest';
  const userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const token = generateToken({
    id: userId,
    email: userId + '@guest.local',
    name
  });

  res.json({ token, userId, name });
});

module.exports = router;

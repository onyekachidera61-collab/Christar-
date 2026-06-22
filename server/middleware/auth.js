const { verifyToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  req.userId = decoded.id;
  req.userEmail = decoded.email;
  next();
};

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('No token provided'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Invalid token'));
  }

  socket.userId = decoded.id;
  socket.userEmail = decoded.email;
  next();
};

module.exports = {
  authenticate,
  authenticateSocket
};

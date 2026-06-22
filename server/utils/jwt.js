const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRE });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};

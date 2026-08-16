const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aparaitech_super_secret_jwt_key_2026_recruitment_email_blast');

      if (getIsConnected()) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        const store = getMemoryStore();
        req.user = store.users.find(u => String(u._id) === String(decoded.id));
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User account no longer exists' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no bearer token provided' });
  }
};

module.exports = { protect };

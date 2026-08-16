const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { logAudit } = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aparaitech_super_secret_jwt_key_2026_recruitment_email_blast', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const isMongo = getIsConnected();
  const store = getMemoryStore();

  let user;

  if (isMongo) {
    user = await User.findOne({ email: cleanEmail });
  } else {
    user = store.users.find(u => u.email.toLowerCase() === cleanEmail);
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials. User not found.' });
  }

  let isMatch = false;
  if (isMongo) {
    isMatch = await user.matchPassword(password);
  } else {
    isMatch = await bcrypt.compare(password, user.password);
  }

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
  }

  user.lastLogin = new Date();
  if (isMongo) await user.save();

  const token = generateToken(user._id);

  logAudit({
    action: 'USER_LOGIN',
    userEmail: user.email,
    userRole: user.role,
    details: `User ${user.name} logged into the dashboard`
  });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    token
  });
};

const getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    department: req.user.department
  });
};

module.exports = { loginUser, getMe };

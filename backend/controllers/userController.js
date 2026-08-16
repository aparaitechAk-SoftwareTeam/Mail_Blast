const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { logAudit } = require('../services/auditService');

const getUsers = async (req, res) => {
  try {
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      res.json(users);
    } else {
      const users = store.users.map(({ password, ...u }) => u);
      res.json(users);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let existing;
    if (isMongo) {
      existing = await User.findOne({ email: cleanEmail });
    } else {
      existing = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    }

    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (isMongo) {
      user = await User.create({
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: role || 'Recruiter',
        department: department || 'Talent Acquisition'
      });
    } else {
      user = {
        _id: `u-${Date.now()}`,
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: role || 'Recruiter',
        department: department || 'Talent Acquisition',
        active: true,
        createdAt: new Date()
      };
      store.users.unshift(user);
    }

    logAudit({
      action: 'CREATE_USER',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Created new ${role || 'Recruiter'} account for ${name} (${cleanEmail})`,
      targetEntity: user._id
    });

    const { password: _, ...userWithoutPass } = user._doc || user;
    res.status(201).json(userWithoutPass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, department, active } = req.body;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let user;
    if (isMongo) {
      user = await User.findByIdAndUpdate(id, { name, role, department, active }, { new: true }).select('-password');
    } else {
      const idx = store.users.findIndex(u => String(u._id) === String(id));
      if (idx !== -1) {
        store.users[idx] = { ...store.users[idx], name, role, department, active };
        const { password, ...uNoPass } = store.users[idx];
        user = uNoPass;
      }
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account while logged in' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      await User.findByIdAndDelete(id);
    } else {
      store.users = store.users.filter(u => String(u._id) !== String(id));
    }

    logAudit({
      action: 'DELETE_USER',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Deleted user account ID ${id}`,
      targetEntity: id
    });

    res.json({ message: 'User account removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };

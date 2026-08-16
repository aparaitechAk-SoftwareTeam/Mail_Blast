const Suppression = require('../models/Suppression');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { logAudit } = require('../services/auditService');

const getSuppressions = async (req, res) => {
  try {
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      const suppressions = await Suppression.find().sort({ createdAt: -1 });
      res.json(suppressions);
    } else {
      res.json(store.suppressions);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addSuppression = async (req, res) => {
  try {
    const { email, reason, notes } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const cleanEmail = email.toLowerCase().trim();
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let suppression;
    if (isMongo) {
      suppression = await Suppression.create({
        email: cleanEmail,
        reason: reason || 'Manual Opt-Out',
        addedBy: req.user.email,
        notes: notes || ''
      });
    } else {
      suppression = {
        _id: `sup-${Date.now()}`,
        email: cleanEmail,
        reason: reason || 'Manual Opt-Out',
        addedBy: req.user.email,
        notes: notes || '',
        createdAt: new Date()
      };
      store.suppressions.unshift(suppression);
    }

    logAudit({
      action: 'ADD_SUPPRESSION',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Added ${cleanEmail} to suppression opt-out list`,
      targetEntity: cleanEmail
    });

    res.status(201).json(suppression);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeSuppression = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      await Suppression.findByIdAndDelete(id);
    } else {
      store.suppressions = store.suppressions.filter(s => String(s._id) !== String(id));
    }

    logAudit({
      action: 'REMOVE_SUPPRESSION',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Removed email ID ${id} from suppression list`,
      targetEntity: id
    });

    res.json({ message: 'Removed from suppression list' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSuppressions, addSuppression, removeSuppression };

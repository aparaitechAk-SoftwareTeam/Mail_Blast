const AuditLog = require('../models/AuditLog');
const { getIsConnected, getMemoryStore } = require('../config/db');

const getAuditLogs = async (req, res) => {
  try {
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
      res.json(logs);
    } else {
      res.json(store.auditLogs);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuditLogs };

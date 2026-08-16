const AuditLog = require('../models/AuditLog');
const { getIsConnected, getMemoryStore } = require('../config/db');

const logAudit = async ({ action, userEmail, userRole = 'Recruiter', details = '', targetEntity = '', ipAddress = '127.0.0.1' }) => {
  try {
    if (getIsConnected()) {
      await AuditLog.create({ action, userEmail, userRole, details, targetEntity, ipAddress });
    } else {
      const store = getMemoryStore();
      store.auditLogs.unshift({
        _id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        action,
        userEmail,
        userRole,
        details,
        targetEntity,
        ipAddress,
        createdAt: new Date()
      });
    }
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
};

module.exports = { logAudit };

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userEmail: { type: String, required: true },
  userRole: { type: String, default: 'Recruiter' },
  details: { type: String, default: '' },
  targetEntity: { type: String, default: '' },
  ipAddress: { type: String, default: '127.0.0.1' }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

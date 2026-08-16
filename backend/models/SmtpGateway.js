const mongoose = require('mongoose');

const smtpGatewaySchema = new mongoose.Schema({
  gatewayName: { type: String, required: true, trim: true },
  provider: { type: String, default: 'Brevo SMTP Relay' },
  smtpHost: { type: String, required: true, default: 'smtp-relay.brevo.com' },
  smtpPort: { type: Number, required: true, default: 587 },
  smtpSecure: { type: Boolean, default: false },
  smtpUser: { type: String, default: '' },
  smtpPass: { type: String, default: '' },
  fromName: { type: String, default: 'Aparaitech Software' },
  fromEmail: { type: String, required: true },
  dailyQuota: { type: Number, default: 300 },
  isActive: { type: Boolean, default: true },
  connectionStatus: { type: String, enum: ['Connected', 'Disconnected', 'Testing', 'Quota Reached', 'Inactive'], default: 'Connected' },
  lastConnectionTest: { type: Date, default: null },
  lastSuccessfulSend: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SmtpGateway', smtpGatewaySchema);

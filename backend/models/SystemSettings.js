const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. 'smtp_config'
  smtpHost: { type: String, default: () => process.env.SMTP_HOST || 'smtp-relay.brevo.com' },
  smtpPort: { type: Number, default: () => parseInt(process.env.SMTP_PORT || '587', 10) },
  smtpSecure: { type: Boolean, default: () => process.env.SMTP_SECURE === 'true' },
  smtpUser: { type: String, default: () => process.env.SMTP_USER || '' },
  smtpPass: { type: String, default: () => process.env.SMTP_PASS || '' },
  fromName: { type: String, default: () => process.env.SMTP_FROM_NAME || 'Aparaitech Software' },
  fromEmail: { type: String, default: () => process.env.SMTP_FROM_EMAIL || '' },
  batchSize: { type: Number, default: () => parseInt(process.env.EMAIL_BATCH_SIZE || '5', 10) },
  delayMs: { type: Number, default: () => parseInt(process.env.EMAIL_DELAY_MS || '200', 10) }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

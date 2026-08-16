const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  recipientEmail: { type: String, required: true, lowercase: true, trim: true },
  recipientName: { type: String, required: true, trim: true },
  subject: { type: String, required: true },
  gatewayId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmtpGateway', default: null },
  gatewayName: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Sending', 'Accepted', 'Sent', 'Delivered', 'Failed', 'Bounced', 'Suppressed', 'Retried'],
    default: 'Pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Sending', 'Accepted', 'Sent', 'Delivered', 'Failed', 'Bounced', 'Suppressed'],
    default: 'Pending'
  },
  messageId: { type: String, default: '' },
  smtpResponse: { type: String, default: '' },
  accepted: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  failureReason: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  retryCount: { type: Number, default: 0 }
}, { timestamps: true });

emailLogSchema.index({ campaignId: 1, status: 1 });
emailLogSchema.index({ recipientEmail: 1 });
emailLogSchema.index({ gatewayId: 1, sentAt: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);

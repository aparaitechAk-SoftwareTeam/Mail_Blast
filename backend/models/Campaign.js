const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  bodyHtml: { type: String, required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: { type: String, default: '' },
  smtpGatewayId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmtpGateway', default: null },
  smtpGatewayName: { type: String, default: '' },
  targetFilters: {
    college: { type: String, default: '' },
    branch: { type: String, default: '' },
    graduationYear: { type: Number, default: null },
    minCgpa: { type: Number, default: 0 },
    placementStatus: { type: String, default: '' },
    customStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
  },
  audienceMode: {
    type: String,
    enum: ['all', 'filtered', 'new_since_last_campaign'],
    default: 'filtered'
  },
  baselineCampaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  baselineTimestamp: { type: Date, default: null },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Sending', 'Completed', 'Failed', 'Cancelled'],
    default: 'Draft'
  },
  scheduledAt: { type: Date, default: null },
  totalRecipients: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  pendingCount: { type: Number, default: 0 },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

campaignSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);

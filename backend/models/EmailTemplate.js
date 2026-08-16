const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['Placement Drive', 'Internship Opportunity', 'Job Opportunity', 'Interview Invitation', 'Interview Shortlist', 'Interview Reminder', 'Campus Recruitment', 'Career Opportunity', 'General Announcement'], 
    default: 'Placement Drive' 
  },
  subject: { type: String, required: true, trim: true },
  bodyHtml: { type: String, required: true },
  description: { type: String, default: '' },
  isPrebuilt: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);

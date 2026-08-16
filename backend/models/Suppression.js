const mongoose = require('mongoose');

const suppressionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  reason: { 
    type: String, 
    enum: ['Unsubscribed', 'Bounced', 'Spam Complaint', 'Manual Opt-Out'], 
    default: 'Manual Opt-Out' 
  },
  addedBy: { type: String, default: 'System' },
  notes: { type: String, default: '' }
}, { timestamps: true });


module.exports = mongoose.model('Suppression', suppressionSchema);

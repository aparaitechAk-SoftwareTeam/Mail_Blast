const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  college: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  graduationYear: { type: Number, required: true },
  cgpa: { type: Number, required: true, min: 0, max: 10 },
  placementStatus: { 
    type: String, 
    enum: ['Unplaced', 'Placed', 'Internship Only', 'Opted Out'], 
    default: 'Unplaced' 
  },
  skills: [{ type: String, trim: true }],
  location: { type: String, default: '' },
  isSubscribed: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

studentSchema.index({ college: 1, branch: 1, graduationYear: 1 });
studentSchema.index({ cgpa: 1 });
studentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Student', studentSchema);

const mongoose = require('mongoose');

let isConnected = false;
let memoryStore = {
  users: [],
  students: [],
  campaigns: [],
  emailLogs: [],
  templates: [],
  suppressions: [],
  auditLogs: [],
  smtpGateways: []
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_email_blast', {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message}. Switching to Fallback Persistent In-Memory Engine.`);
    isConnected = false;
  }
};

const getIsConnected = () => isConnected;
const getMemoryStore = () => memoryStore;

module.exports = { connectDB, getIsConnected, getMemoryStore };

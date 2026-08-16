const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const { seedData } = require('./utils/seeder');
const { initCampaignSocket } = require('./sockets/campaignSocket');
const { initScheduler } = require('./services/schedulerService');
const errorHandler = require('./middleware/errorHandler');

// Controllers & Middleware
const { protect } = require('./middleware/authMiddleware');
const { authorize } = require('./middleware/roleMiddleware');
const upload = require('./middleware/uploadMiddleware');
const {
  validateStudentPayload,
  validateCampaignPayload,
  validateTemplatePayload,
  validateUserPayload,
  validateSuppressionPayload
} = require('./middleware/validationMiddleware');

const { loginUser, getMe } = require('./controllers/authController');
const { getStudents, createStudent, updateStudent, deleteStudent, bulkDeleteStudents } = require('./controllers/studentController');
const { previewUpload, confirmImport } = require('./controllers/uploadController');
const { getCampaigns, getCampaignById, createCampaign, launchCampaign, retryFailedEmails, sendTestEmail, directSmtpTest } = require('./controllers/campaignController');
const { getTemplates, createTemplate, updateTemplate, deleteTemplate } = require('./controllers/templateController');
const { getDashboardStats, getDetailedReports, getPublicSummaryStats } = require('./controllers/reportController');
const { getUsers, createUser, updateUser, deleteUser } = require('./controllers/userController');
const { getSuppressions, addSuppression, removeSuppression } = require('./controllers/suppressionController');
const { getAuditLogs } = require('./controllers/auditController');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

initCampaignSocket(io);

// Security & Parsing Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// System Health & Public Summary Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Aparaitech Student Email Blast API',
    timestamp: new Date()
  });
});
app.get('/api/public/summary', getPublicSummaryStats);

// Auth Routes
app.post('/api/auth/login', loginUser);
app.get('/api/auth/me', protect, getMe);

// Student Directory Routes
app.get('/api/students', protect, getStudents);
app.post('/api/students', protect, authorize('Admin', 'Recruiter'), validateStudentPayload, createStudent);
app.put('/api/students/:id', protect, authorize('Admin', 'Recruiter'), validateStudentPayload, updateStudent);
app.delete('/api/students/bulk-delete', protect, authorize('Admin', 'Recruiter'), bulkDeleteStudents);
app.delete('/api/students/:id', protect, authorize('Admin', 'Recruiter'), deleteStudent);

// CSV / XLSX Bulk Import Routes
app.post('/api/upload/preview', protect, authorize('Admin', 'Recruiter'), upload.single('file'), previewUpload);
app.post('/api/upload/confirm', protect, authorize('Admin', 'Recruiter'), confirmImport);

// Campaign Routes
app.get('/api/campaigns', protect, getCampaigns);
app.get('/api/campaigns/:id', protect, getCampaignById);
app.post('/api/campaigns', protect, authorize('Admin', 'Recruiter'), validateCampaignPayload, createCampaign);
app.post('/api/campaigns/:id/launch', protect, authorize('Admin', 'Recruiter'), launchCampaign);
app.post('/api/campaigns/:id/retry', protect, authorize('Admin', 'Recruiter'), retryFailedEmails);
app.post('/api/campaigns/send-test', protect, authorize('Admin', 'Recruiter'), sendTestEmail);
app.post('/api/campaigns/direct-test', protect, authorize('Admin', 'Recruiter'), directSmtpTest);

// Template Routes
app.get('/api/templates', protect, getTemplates);
app.post('/api/templates', protect, authorize('Admin', 'Recruiter'), validateTemplatePayload, createTemplate);
app.put('/api/templates/:id', protect, authorize('Admin', 'Recruiter'), validateTemplatePayload, updateTemplate);
app.delete('/api/templates/:id', protect, authorize('Admin', 'Recruiter'), deleteTemplate);

// Analytics & Reports Routes
app.get('/api/reports/dashboard', protect, getDashboardStats);
app.get('/api/reports/detailed', protect, getDetailedReports);

// Admin User Management Routes
app.get('/api/users', protect, authorize('Admin'), getUsers);
app.post('/api/users', protect, authorize('Admin'), validateUserPayload, createUser);
app.put('/api/users/:id', protect, authorize('Admin'), validateUserPayload, updateUser);
app.delete('/api/users/:id', protect, authorize('Admin'), deleteUser);

// Suppression & Opt-Out Routes
app.get('/api/suppressions', protect, getSuppressions);
app.post('/api/suppressions', protect, authorize('Admin', 'Recruiter'), validateSuppressionPayload, addSuppression);
app.delete('/api/suppressions/:id', protect, authorize('Admin'), removeSuppression);

// Audit Logs Route
app.get('/api/audit-logs', protect, authorize('Admin'), getAuditLogs);

// System Settings & Gateway Routes
const { 
  getSmtpSettings, 
  updateSmtpSettings, 
  testSmtpConnection, 
  sendSmtpTestEmail, 
  getDeliveryStatus,
  getSmtpGateways,
  createSmtpGateway,
  updateSmtpGateway,
  deleteSmtpGateway,
  testSmtpGatewayConnection
} = require('./controllers/settingsController');

// Gateway Pool Routes
app.get('/api/settings/smtp/gateways', protect, getSmtpGateways);
app.post('/api/settings/smtp/gateways', protect, authorize('Admin'), createSmtpGateway);
app.put('/api/settings/smtp/gateways/:id', protect, authorize('Admin'), updateSmtpGateway);
app.delete('/api/settings/smtp/gateways/:id', protect, authorize('Admin'), deleteSmtpGateway);
app.post('/api/settings/smtp/gateways/:id/test', protect, authorize('Admin', 'Recruiter'), testSmtpGatewayConnection);

// System Settings & Test Email Routes
app.get('/api/settings/smtp', protect, getSmtpSettings);
app.post('/api/settings/smtp', protect, authorize('Admin'), updateSmtpSettings);
app.post('/api/settings/smtp/test', protect, authorize('Admin', 'Recruiter'), testSmtpConnection);
app.post('/api/settings/smtp/send-test', protect, authorize('Admin', 'Recruiter'), sendSmtpTestEmail);
app.get('/api/settings/smtp/delivery-status/:messageId', protect, getDeliveryStatus);

// Global Error Handler
app.use(errorHandler);

const { recoverInterruptedQueue } = require('./services/emailQueueService');
const { createTransporter, verifySMTP } = require('./config/mailer');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  await seedData();
  const transporter = await createTransporter();
  await verifySMTP(transporter);
  initScheduler();
  await recoverInterruptedQueue();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n===================================================`);
      console.error(`[PORT CONFLICT ERROR] Port ${PORT} is already in use.`);
      console.error(`An instance of Student Email Blast Backend is already running on http://localhost:${PORT}`);
      console.error(`Please stop the running process before starting a new server.`);
      console.error(`===================================================\n`);
      process.exit(1);
    } else {
      console.error('[SERVER ERROR]:', err);
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` Aparaitech Student Email Blast Backend Engine      `);
    console.log(` Running on Port: ${PORT}                         `);
    console.log(` API Endpoint: http://localhost:${PORT}/api         `);
    console.log(` Email Queue Service: ACTIVE                       `);
    console.log(` Socket.IO Real-time Engine: ACTIVE                `);
    console.log(`===================================================`);
  });
};

startServer();

const Campaign = require('../models/Campaign');
const EmailLog = require('../models/EmailLog');
const Student = require('../models/Student');
const Suppression = require('../models/Suppression');
const { processCampaignQueue, personalizeContent } = require('../services/emailQueueService');
const { createTransporter, sendSingleEmail } = require('../config/mailer');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { logAudit } = require('../services/auditService');

const getCampaigns = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 10 } = req.query;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      const query = status ? { status } : {};
      const total = await Campaign.countDocuments(query);
      const campaigns = await Campaign.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

      return res.json({ campaigns, total });
    } else {
      let filtered = [...store.campaigns];
      if (status) filtered = filtered.filter(c => c.status === status);
      return res.json({ campaigns: filtered, total: filtered.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let campaign;
    let logs = [];

    if (isMongo) {
      campaign = await Campaign.findById(id);
      if (campaign) {
        logs = await EmailLog.find({ campaignId: id }).sort({ createdAt: -1 });
      }
    } else {
      campaign = store.campaigns.find(c => String(c._id) === String(id));
      if (campaign) {
        logs = store.emailLogs.filter(l => String(l.campaignId) === String(id));
      }
    }

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    res.json({ campaign, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCampaign = async (req, res) => {
  try {
    const { title, subject, bodyHtml, templateId, targetFilters, scheduledAt } = req.body;

    if (!title || !subject || !bodyHtml) {
      return res.status(400).json({ message: 'Campaign title, subject, and email body are required' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    // Query targeted students
    let targetStudents = [];
    const filters = targetFilters || {};

    if (isMongo) {
      const query = { isSubscribed: true };
      if (filters.college) query.college = filters.college;
      if (filters.branch) query.branch = filters.branch;
      if (filters.graduationYear) query.graduationYear = parseInt(filters.graduationYear);
      if (filters.minCgpa) query.cgpa = { $gte: parseFloat(filters.minCgpa) };
      if (filters.placementStatus) query.placementStatus = filters.placementStatus;

      targetStudents = await Student.find(query);
    } else {
      let stList = store.students.filter(s => s.isSubscribed !== false);
      if (filters.college) stList = stList.filter(s => s.college === filters.college);
      if (filters.branch) stList = stList.filter(s => s.branch === filters.branch);
      if (filters.graduationYear) stList = stList.filter(s => s.graduationYear === parseInt(filters.graduationYear));
      if (filters.minCgpa) stList = stList.filter(s => s.cgpa >= parseFloat(filters.minCgpa));
      if (filters.placementStatus) stList = stList.filter(s => s.placementStatus === filters.placementStatus);
      targetStudents = stList;
    }

    const totalRecipients = targetStudents.length;
    const isImmediate = !scheduledAt;
    const initialStatus = isImmediate ? 'Sending' : 'Scheduled';

    let campaign;
    if (isMongo) {
      campaign = await Campaign.create({
        title,
        subject,
        bodyHtml,
        templateId: templateId || null,
        createdBy: req.user._id,
        createdByName: req.user.name,
        targetFilters: filters,
        totalRecipients,
        sentCount: 0,
        failedCount: 0,
        pendingCount: totalRecipients,
        status: initialStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        startedAt: isImmediate ? new Date() : null
      });

      // Create Email Logs for each student
      const emailLogsDocs = targetStudents.map(st => ({
        campaignId: campaign._id,
        studentId: st._id,
        recipientEmail: st.email,
        recipientName: st.name,
        subject: subject,
        status: 'Pending'
      }));

      await EmailLog.insertMany(emailLogsDocs);
    } else {
      const campaignId = `cmp-${Date.now()}`;
      campaign = {
        _id: campaignId,
        title,
        subject,
        bodyHtml,
        templateId: templateId || null,
        createdBy: req.user._id,
        createdByName: req.user.name,
        targetFilters: filters,
        totalRecipients,
        sentCount: 0,
        failedCount: 0,
        pendingCount: totalRecipients,
        status: initialStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        startedAt: isImmediate ? new Date() : null,
        createdAt: new Date()
      };
      store.campaigns.unshift(campaign);

      targetStudents.forEach((st, idx) => {
        store.emailLogs.push({
          _id: `log-${Date.now()}-${idx}`,
          campaignId: campaign._id,
          studentId: st._id,
          recipientEmail: st.email,
          recipientName: st.name,
          subject: subject,
          status: 'Pending',
          createdAt: new Date()
        });
      });
    }

    // Trigger immediate email queue processing if not scheduled
    if (isImmediate && totalRecipients > 0) {
      console.log(`[EMAIL QUEUE] Launching immediate dispatch for Campaign "${title}" (${totalRecipients} recipients)...`);
      processCampaignQueue(campaign._id);
    }

    logAudit({
      action: 'CREATE_CAMPAIGN',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Created campaign "${title}" targeted to ${totalRecipients} recipients (${initialStatus})`,
      targetEntity: campaign._id
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const launchCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let campaign;
    if (isMongo) {
      campaign = await Campaign.findById(id);
    } else {
      campaign = store.campaigns.find(c => String(c._id) === String(id));
    }

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status === 'Sending' || campaign.status === 'Completed') {
      return res.status(400).json({ message: `Campaign is already ${campaign.status}` });
    }

    // Trigger async email queue processing
    processCampaignQueue(id);

    logAudit({
      action: 'LAUNCH_CAMPAIGN',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Dispatched campaign launch for "${campaign.title}"`,
      targetEntity: id
    });

    res.json({ message: 'Campaign dispatch started successfully', campaignId: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const retryFailedEmails = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let campaign;
    if (isMongo) {
      campaign = await Campaign.findById(id);
    } else {
      campaign = store.campaigns.find(c => String(c._id) === String(id));
    }

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    processCampaignQueue(id, true);

    logAudit({
      action: 'RETRY_CAMPAIGN_FAILED',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Triggered retry for failed recipient logs in campaign "${campaign.title}"`,
      targetEntity: id
    });

    res.json({ message: 'Retrying failed emails in background', campaignId: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendTestEmail = async (req, res) => {
  try {
    const { targetEmail, subject, bodyHtml, testStudentId } = req.body;

    if (!targetEmail || !subject || !bodyHtml) {
      return res.status(400).json({ message: 'Target email, subject, and content are required' });
    }

    const transporter = await createTransporter();

    const sampleStudent = {
      name: 'Test Student',
      email: targetEmail,
      college: 'COEP Technological University',
      branch: 'Computer Engineering',
      graduationYear: 2026,
      cgpa: 8.8,
      placementStatus: 'Unplaced'
    };

    const personalizedHtml = personalizeContent(bodyHtml, sampleStudent);
    const personalizedSubject = personalizeContent(subject, sampleStudent);

    const result = await sendSingleEmail(transporter, {
      to: targetEmail,
      subject: `[TEST PREVIEW] ${personalizedSubject}`,
      html: personalizedHtml
    });

    if (result.success) {
      res.json({ 
        message: 'SMTP accepted the email. Final inbox placement may depend on the recipient mail provider.',
        messageId: result.messageId,
        smtpResponse: result.smtpResponse,
        accepted: result.accepted,
        rejected: result.rejected,
        sender: result.from,
        recipient: targetEmail,
        previewUrl: result.previewUrl
      });
    } else {
      res.status(500).json({ message: `Failed to send test email: ${result.error}` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const directSmtpTest = async (req, res) => {
  try {
    const targetEmail = req.body.targetEmail || 'nileshrajpure037@gmail.com';
    const transporter = await createTransporter();

    const fromName = process.env.SMTP_FROM_NAME || 'Aparaitech Software';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'krushnarathod.aparaitech@gmail.com';

    const mailOptions = {
      from: {
        name: fromName,
        address: fromEmail
      },
      replyTo: {
        name: fromName,
        address: fromEmail
      },
      to: targetEmail,
      subject: req.body.subject || 'FINAL GMAIL DELIVERY VERIFICATION - APARAITECH',
      text: req.body.text || 'Hello Nilesh,\n\nThis is the final real Gmail delivery verification email from Aparaitech Software Student Email Blast.\n\nIf you can see this message in Gmail, the end-to-end delivery test has passed.\n\nRegards,\nAparaitech Software Recruitment Team',
      html: req.body.html || '<p>Hello Nilesh,</p><p>This is the final real Gmail delivery verification email from <strong>Aparaitech Software Student Email Blast</strong>.</p><p>If you can see this message in Gmail, the end-to-end delivery test has passed.</p><p>Regards,<br>Aparaitech Software Recruitment Team</p>'
    };

    console.log(`\n===================================================`);
    console.log(`[DIRECT SMTP TEST DISPATCH]`);
    console.log(`Target: ${targetEmail}`);
    console.log(`From: ${JSON.stringify(mailOptions.from)}`);

    const info = await transporter.sendMail(mailOptions);

    console.log(`Message ID: ${info.messageId}`);
    console.log(`Accepted: ${JSON.stringify(info.accepted)}`);
    console.log(`Rejected: ${JSON.stringify(info.rejected)}`);
    console.log(`Pending: ${JSON.stringify(info.pending || [])}`);
    console.log(`Envelope: ${JSON.stringify(info.envelope || {})}`);
    console.log(`SMTP Response: ${info.response}`);
    console.log(`===================================================\n`);

    res.json({
      message: 'Direct SMTP test dispatched successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending || [],
      envelope: info.envelope || {},
      smtpResponse: info.response,
      sender: mailOptions.from,
      recipient: targetEmail
    });
  } catch (error) {
    console.error('[DIRECT SMTP TEST ERROR]:', error.message);
    res.status(500).json({ message: `Direct SMTP test failed: ${error.message}` });
  }
};

module.exports = { getCampaigns, getCampaignById, createCampaign, launchCampaign, retryFailedEmails, sendTestEmail, directSmtpTest };

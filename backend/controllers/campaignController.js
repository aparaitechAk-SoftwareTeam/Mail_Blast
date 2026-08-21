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

    // Actual EmailLog aggregation grouped by gatewayId / gatewayName (Requirement 12)
    const gwMap = new Map();
    for (const log of logs) {
      const gId = log.gatewayId ? String(log.gatewayId) : 'unassigned';
      const gName = log.gatewayName || 'Primary Gateway';
      if (!gwMap.has(gId)) {
        gwMap.set(gId, { gatewayId: log.gatewayId || null, gatewayName: gName, total: 0, sent: 0, failed: 0, pending: 0 });
      }
      const entry = gwMap.get(gId);
      entry.total++;
      if (log.status === 'Sent') entry.sent++;
      else if (log.status === 'Failed' || log.status === 'Bounced' || log.status === 'Suppressed') entry.failed++;
      else entry.pending++;
    }

    const deliverySummary = Array.from(gwMap.values());

    res.json({ campaign, logs, deliverySummary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { ensureGatewayDailyReset, getGatewayDailyUsage } = require('./settingsController');

const createCampaign = async (req, res) => {
  try {
    const { 
      title, 
      subject, 
      bodyHtml, 
      templateId, 
      targetFilters, 
      scheduledAt, 
      audienceMode = 'filtered', 
      smtpGatewayId,
      deliveryMethod = 'single',
      selectedGatewayIds = []
    } = req.body;

    if (!title || !subject || !bodyHtml) {
      return res.status(400).json({ message: 'Campaign title, subject, and email body are required' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    // Query targeted students
    let targetStudents = [];
    const filters = targetFilters || {};
    let lastCampaign = null;
    let baselineTimestamp = null;

    if (isMongo) {
      const query = { isSubscribed: true };

      if (audienceMode === 'new_since_last_campaign') {
        lastCampaign = await Campaign.findOne({ status: 'Completed' }).sort({ completedAt: -1, createdAt: -1 });
        if (lastCampaign) {
          baselineTimestamp = lastCampaign.completedAt || lastCampaign.createdAt;
          query.createdAt = { $gt: baselineTimestamp };
        } else {
          query._id = null;
        }
      }

      if (audienceMode !== 'all') {
        if (filters.college) query.college = filters.college;
        if (filters.branch) query.branch = filters.branch;
        if (filters.graduationYear) query.graduationYear = parseInt(filters.graduationYear);
        if (filters.minCgpa) query.cgpa = { $gte: parseFloat(filters.minCgpa) };
        if (filters.placementStatus) query.placementStatus = filters.placementStatus;
      }

      targetStudents = query._id === null ? [] : await Student.find(query);
    } else {
      let stList = store.students.filter(s => s.isSubscribed !== false);

      if (audienceMode === 'new_since_last_campaign') {
        lastCampaign = store.campaigns.find(c => c.status === 'Completed');
        if (lastCampaign) {
          baselineTimestamp = new Date(lastCampaign.completedAt || lastCampaign.createdAt);
          stList = stList.filter(s => new Date(s.createdAt || Date.now()) > baselineTimestamp);
        } else {
          stList = [];
        }
      }

      if (audienceMode !== 'all') {
        if (filters.college) stList = stList.filter(s => s.college === filters.college);
        if (filters.branch) stList = stList.filter(s => s.branch === filters.branch);
        if (filters.graduationYear) stList = stList.filter(s => s.graduationYear === parseInt(filters.graduationYear));
        if (filters.minCgpa) stList = stList.filter(s => s.cgpa >= parseFloat(filters.minCgpa));
        if (filters.placementStatus) stList = stList.filter(s => s.placementStatus === filters.placementStatus);
      }
      targetStudents = stList;
    }

    const totalRecipients = targetStudents.length;

    // Resolve & Validate Gateways for Multi vs Single Delivery Method
    let gatewayBuckets = [];
    let primaryGateway = null;

    if (deliveryMethod === 'multi') {
      const gIds = Array.isArray(selectedGatewayIds) ? selectedGatewayIds.filter(Boolean) : [];
      let rawGateways = [];

      if (isMongo) {
        rawGateways = await SmtpGateway.find({ _id: { $in: gIds } }).sort({ createdAt: 1 });
      } else {
        rawGateways = (store.smtpGateways || []).filter(g => gIds.map(String).includes(String(g._id)));
      }

      // Filter for active & non-disconnected gateways
      for (const gw of rawGateways) {
        const gwDoc = await ensureGatewayDailyReset(gw);
        if (!gwDoc) continue;

        const isActive = gwDoc.isActive !== false;
        const isConnected = gwDoc.connectionStatus !== 'Disconnected';
        if (isActive && isConnected) {
          const quota = gwDoc.dailyQuota || 300;
          const used = gwDoc.dailyUsed || 0;
          const rem = Math.max(0, quota - used);
          gatewayBuckets.push({
            gateway: gwDoc,
            remainingCapacity: rem,
            allocatedCount: 0
          });
        }
      }

      const totalAvailableCapacity = gatewayBuckets.reduce((sum, b) => sum + b.remainingCapacity, 0);

      if (totalRecipients > 0 && totalAvailableCapacity < totalRecipients) {
        return res.status(400).json({
          message: `INSUFFICIENT DELIVERY CAPACITY. Campaign requested ${totalRecipients} recipients, but selected gateways have only ${totalAvailableCapacity} total remaining capacity today.`
        });
      }

      if (gatewayBuckets.length > 0) {
        primaryGateway = gatewayBuckets[0].gateway;
      }
    } else {
      // Single Gateway mode
      let selectedGateway = null;
      if (smtpGatewayId) {
        if (isMongo) {
          selectedGateway = await SmtpGateway.findById(smtpGatewayId);
        } else {
          selectedGateway = (store.smtpGateways || []).find(g => String(g._id) === String(smtpGatewayId));
        }
      }
      if (!selectedGateway) {
        if (isMongo) {
          selectedGateway = await SmtpGateway.findOne({ isActive: true }).sort({ createdAt: 1 });
        } else {
          selectedGateway = (store.smtpGateways || []).find(g => g.isActive !== false);
        }
      }

      if (selectedGateway) {
        const gwDoc = await ensureGatewayDailyReset(selectedGateway);
        const quota = gwDoc?.dailyQuota || 300;
        const used = gwDoc?.dailyUsed || 0;
        const rem = Math.max(0, quota - used);

        if (totalRecipients > 0 && rem < totalRecipients) {
          return res.status(400).json({
            message: `INSUFFICIENT DELIVERY CAPACITY. Campaign requested ${totalRecipients} recipients, but gateway "${gwDoc?.gatewayName}" has only ${rem} remaining capacity today.`
          });
        }

        primaryGateway = gwDoc;
        gatewayBuckets = [{
          gateway: gwDoc,
          remainingCapacity: rem,
          allocatedCount: 0
        }];
      }
    }

    // Fallback if no gateway buckets resolved
    if (gatewayBuckets.length === 0) {
      let defaultGw;
      if (isMongo) {
        defaultGw = await SmtpGateway.findOne({ isActive: true }).sort({ createdAt: 1 });
      } else {
        defaultGw = (store.smtpGateways || []).find(g => g.isActive !== false);
      }
      if (defaultGw) {
        primaryGateway = defaultGw;
        gatewayBuckets = [{
          gateway: defaultGw,
          remainingCapacity: 9999,
          allocatedCount: 0
        }];
      }
    }

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
        smtpGatewayId: primaryGateway ? primaryGateway._id : null,
        smtpGatewayName: primaryGateway ? primaryGateway.gatewayName : 'Primary Gateway',
        deliveryMethod: deliveryMethod || 'single',
        selectedGatewayIds: gatewayBuckets.map(b => b.gateway._id),
        targetFilters: filters,
        audienceMode: audienceMode || 'filtered',
        baselineCampaignId: lastCampaign ? lastCampaign._id : null,
        baselineTimestamp: baselineTimestamp || null,
        totalRecipients,
        sentCount: 0,
        failedCount: 0,
        pendingCount: totalRecipients,
        status: initialStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        startedAt: isImmediate ? new Date() : null
      });

      // Deterministically allocate recipients to gateways based on remaining capacity
      const emailLogsDocs = targetStudents.map(st => {
        // Find bucket with available allocation
        let targetBucket = gatewayBuckets.find(b => b.allocatedCount < b.remainingCapacity);
        if (!targetBucket) {
          targetBucket = gatewayBuckets[0];
        }
        targetBucket.allocatedCount++;

        return {
          campaignId: campaign._id,
          studentId: st._id,
          recipientEmail: st.email,
          recipientName: st.name,
          subject: subject,
          gatewayId: targetBucket.gateway._id,
          gatewayName: targetBucket.gateway.gatewayName,
          status: 'Pending'
        };
      });

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
        smtpGatewayId: primaryGateway ? primaryGateway._id : null,
        smtpGatewayName: primaryGateway ? primaryGateway.gatewayName : 'Primary Gateway',
        deliveryMethod: deliveryMethod || 'single',
        selectedGatewayIds: gatewayBuckets.map(b => b.gateway._id),
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
        let targetBucket = gatewayBuckets.find(b => b.allocatedCount < b.remainingCapacity);
        if (!targetBucket) {
          targetBucket = gatewayBuckets[0];
        }
        targetBucket.allocatedCount++;

        store.emailLogs.push({
          _id: `log-${Date.now()}-${idx}`,
          campaignId: campaign._id,
          studentId: st._id,
          recipientEmail: st.email,
          recipientName: st.name,
          subject: subject,
          gatewayId: targetBucket.gateway._id,
          gatewayName: targetBucket.gateway.gatewayName,
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
    const { targetEmail, subject, bodyHtml, testStudentId, smtpGatewayId } = req.body;

    if (!targetEmail || !subject || !bodyHtml) {
      return res.status(400).json({ message: 'Target email, subject, and content are required' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let targetGateway = null;
    if (smtpGatewayId) {
      if (isMongo) {
        targetGateway = await SmtpGateway.findById(smtpGatewayId);
      } else {
        targetGateway = (store.smtpGateways || []).find(g => String(g._id) === String(smtpGatewayId));
      }
    } else {
      if (isMongo) {
        targetGateway = await SmtpGateway.findOne({ isActive: true }).sort({ createdAt: 1 });
      } else {
        targetGateway = (store.smtpGateways || []).find(g => g.isActive !== false);
      }
    }

    const transporter = targetGateway ? await createTransporter(targetGateway) : await createTransporter();

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
      html: personalizedHtml,
      fromName: targetGateway?.fromName,
      fromEmail: targetGateway?.fromEmail
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
        gatewayName: targetGateway?.gatewayName || 'Primary Gateway',
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

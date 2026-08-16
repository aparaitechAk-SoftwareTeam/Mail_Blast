const SystemSettings = require('../models/SystemSettings');
const SmtpGateway = require('../models/SmtpGateway');
const EmailLog = require('../models/EmailLog');
const axios = require('axios');
const { createTransporter, verifySMTP, sendSingleEmail, getActiveSmtpCredentials } = require('../config/mailer');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { logAudit } = require('../services/auditService');

// Ensure at least 1 gateway exists by converting legacy SystemSettings / .env config into Gateway 1
const ensureDefaultGateway = async () => {
  const isMongo = getIsConnected();
  const store = getMemoryStore();

  if (isMongo) {
    const count = await SmtpGateway.countDocuments();
    if (count === 0) {
      const settings = await SystemSettings.findOne({ key: 'smtp_config' });
      await SmtpGateway.create({
        gatewayName: 'Brevo Gateway 01',
        provider: 'Brevo SMTP Relay',
        smtpHost: settings?.smtpHost || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        smtpPort: settings?.smtpPort || parseInt(process.env.SMTP_PORT || '587', 10),
        smtpSecure: settings?.smtpSecure ?? (process.env.SMTP_SECURE === 'true'),
        smtpUser: settings?.smtpUser || process.env.SMTP_USER || '',
        smtpPass: settings?.smtpPass || process.env.SMTP_PASS || '',
        fromName: settings?.fromName || process.env.SMTP_FROM_NAME || 'Aparaitech Software',
        fromEmail: settings?.fromEmail || process.env.SMTP_FROM_EMAIL || 'krushnarathod.aparaitech@gmail.com',
        dailyQuota: 300,
        isActive: true,
        connectionStatus: 'Connected',
        lastConnectionTest: new Date()
      });
    }
  } else {
    if (!store.smtpGateways || store.smtpGateways.length === 0) {
      store.smtpGateways = [{
        _id: 'default-gateway-1',
        gatewayName: 'Brevo Gateway 01',
        provider: 'Brevo SMTP Relay',
        smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
        smtpSecure: process.env.SMTP_SECURE === 'true',
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS || '',
        fromName: process.env.SMTP_FROM_NAME || 'Aparaitech Software',
        fromEmail: process.env.SMTP_FROM_EMAIL || 'krushnarathod.aparaitech@gmail.com',
        dailyQuota: 300,
        isActive: true,
        connectionStatus: 'Connected',
        lastConnectionTest: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    }
  }
};

// Calculate daily sent count for a specific gateway
const getGatewayDailyUsage = async (gatewayId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const isMongo = getIsConnected();
  if (isMongo) {
    let gatewayFilter = {};
    if (gatewayId) {
      const gIdStr = String(gatewayId);
      let gObjId = null;
      if (mongoose.Types.ObjectId.isValid(gIdStr)) {
        gObjId = new mongoose.Types.ObjectId(gIdStr);
      }

      const allGateways = await SmtpGateway.find().sort({ createdAt: 1 });
      const isFirstGateway = allGateways.length > 0 && String(allGateways[0]._id) === gIdStr;

      if (isFirstGateway) {
        gatewayFilter = {
          $or: [
            { gatewayId: gObjId || gIdStr },
            { gatewayId: gIdStr },
            { gatewayId: null },
            { gatewayId: { $exists: false } }
          ]
        };
      } else {
        gatewayFilter = {
          $or: [
            { gatewayId: gObjId || gIdStr },
            { gatewayId: gIdStr }
          ]
        };
      }
    }

    const query = {
      status: 'Sent',
      sentAt: { $gte: startOfDay },
      ...gatewayFilter
    };

    return await EmailLog.countDocuments(query);
  } else {
    const store = getMemoryStore();
    return (store.emailLogs || []).filter(l => {
      const matchGateway = !gatewayId || String(l.gatewayId) === String(gatewayId);
      const isSent = l.status === 'Sent';
      const sentTime = l.sentAt ? new Date(l.sentAt) : new Date(0);
      return matchGateway && isSent && sentTime >= startOfDay;
    }).length;
  }
};

// Sanitize gateway object for client (strip passwords)
const sanitizeGateway = (gw, usage = 0) => {
  const obj = gw.toObject ? gw.toObject() : { ...gw };
  const dailyQuota = obj.dailyQuota || 300;
  const remainingCapacity = Math.max(0, dailyQuota - usage);
  const usagePercentage = dailyQuota > 0 ? Math.min(100, Math.round((usage / dailyQuota) * 100)) : 0;
  const passConfigured = !!obj.smtpPass;
  delete obj.smtpPass;

  let computedStatus = obj.isActive === false ? 'Inactive' : obj.connectionStatus || 'Connected';
  if (obj.isActive !== false && remainingCapacity === 0) {
    computedStatus = 'Quota Reached';
  }

  return {
    ...obj,
    dailyUsage: usage,
    remainingCapacity,
    usagePercentage,
    passConfigured,
    connectionStatus: computedStatus
  };
};

// GET /api/settings/smtp/gateways
const getSmtpGateways = async (req, res) => {
  try {
    await ensureDefaultGateway();
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let gateways = [];
    if (isMongo) {
      gateways = await SmtpGateway.find().sort({ createdAt: 1 });
    } else {
      gateways = store.smtpGateways || [];
    }

    const sanitized = await Promise.all(
      gateways.map(async (gw) => {
        const usage = await getGatewayDailyUsage(gw._id);
        return sanitizeGateway(gw, usage);
      })
    );

    res.json({
      totalCount: sanitized.length,
      maxAllowed: 3,
      canAddMore: sanitized.length < 3,
      gateways: sanitized
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/settings/smtp/gateways
const createSmtpGateway = async (req, res) => {
  try {
    await ensureDefaultGateway();
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let currentCount = 0;
    if (isMongo) {
      currentCount = await SmtpGateway.countDocuments();
    } else {
      currentCount = (store.smtpGateways || []).length;
    }

    if (currentCount >= 3) {
      return res.status(400).json({ message: 'Maximum 3 SMTP gateways allowed in pool. Delete or edit an existing gateway.' });
    }

    const { gatewayName, provider, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, fromName, fromEmail, dailyQuota } = req.body;

    if (!gatewayName || !fromEmail) {
      return res.status(400).json({ message: 'Gateway name and sender email address are required' });
    }

    let newGateway;
    if (isMongo) {
      newGateway = await SmtpGateway.create({
        gatewayName: gatewayName.trim(),
        provider: provider || 'Brevo SMTP Relay',
        smtpHost: smtpHost || 'smtp-relay.brevo.com',
        smtpPort: parseInt(smtpPort || '587', 10),
        smtpSecure: !!smtpSecure,
        smtpUser: smtpUser || process.env.SMTP_USER || '',
        smtpPass: smtpPass || process.env.SMTP_PASS || '',
        fromName: fromName || 'Aparaitech Software',
        fromEmail: fromEmail.trim(),
        dailyQuota: parseInt(dailyQuota || '300', 10),
        isActive: true,
        connectionStatus: 'Connected',
        lastConnectionTest: new Date()
      });
    } else {
      newGateway = {
        _id: `gw-${Date.now()}`,
        gatewayName: gatewayName.trim(),
        provider: provider || 'Brevo SMTP Relay',
        smtpHost: smtpHost || 'smtp-relay.brevo.com',
        smtpPort: parseInt(smtpPort || '587', 10),
        smtpSecure: !!smtpSecure,
        smtpUser: smtpUser || process.env.SMTP_USER || '',
        smtpPass: smtpPass || process.env.SMTP_PASS || '',
        fromName: fromName || 'Aparaitech Software',
        fromEmail: fromEmail.trim(),
        dailyQuota: parseInt(dailyQuota || '300', 10),
        isActive: true,
        connectionStatus: 'Connected',
        lastConnectionTest: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.smtpGateways.push(newGateway);
    }

    logAudit({
      action: 'CREATE_SMTP_GATEWAY',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Added new SMTP gateway "${gatewayName}" (${fromEmail}) to pool`
    });

    res.status(201).json({
      message: 'SMTP Gateway added successfully',
      gateway: sanitizeGateway(newGateway, 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings/smtp/gateways/:id
const updateSmtpGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const { gatewayName, provider, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, fromName, fromEmail, dailyQuota, isActive } = req.body;

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let gateway;
    if (isMongo) {
      gateway = await SmtpGateway.findById(id);
    } else {
      gateway = (store.smtpGateways || []).find(g => String(g._id) === String(id));
    }

    if (!gateway) {
      return res.status(404).json({ message: 'SMTP Gateway not found' });
    }

    if (gatewayName) gateway.gatewayName = gatewayName.trim();
    if (provider !== undefined) gateway.provider = provider;
    if (smtpHost) gateway.smtpHost = smtpHost;
    if (smtpPort) gateway.smtpPort = parseInt(smtpPort, 10);
    if (smtpSecure !== undefined) gateway.smtpSecure = !!smtpSecure;
    if (smtpUser !== undefined) gateway.smtpUser = smtpUser;
    if (smtpPass && smtpPass !== '••••••••') gateway.smtpPass = smtpPass;
    if (fromName) gateway.fromName = fromName;
    if (fromEmail) gateway.fromEmail = fromEmail.trim();
    if (dailyQuota) gateway.dailyQuota = parseInt(dailyQuota, 10);
    if (isActive !== undefined) gateway.isActive = !!isActive;
    gateway.updatedAt = new Date();

    if (isMongo) {
      await gateway.save();
    }

    logAudit({
      action: 'UPDATE_SMTP_GATEWAY',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Updated SMTP gateway "${gateway.gatewayName}" (${gateway._id})`
    });

    const usage = await getGatewayDailyUsage(gateway._id);
    res.json({
      message: 'SMTP Gateway updated successfully',
      gateway: sanitizeGateway(gateway, usage)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/settings/smtp/gateways/:id
const deleteSmtpGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let count = 0;
    if (isMongo) {
      count = await SmtpGateway.countDocuments();
    } else {
      count = (store.smtpGateways || []).length;
    }

    if (count <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only SMTP gateway in pool. At least 1 gateway must remain active.' });
    }

    if (isMongo) {
      await SmtpGateway.findByIdAndDelete(id);
    } else {
      store.smtpGateways = (store.smtpGateways || []).filter(g => String(g._id) !== String(id));
    }

    logAudit({
      action: 'DELETE_SMTP_GATEWAY',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Deleted SMTP gateway ID ${id}`
    });

    res.json({ message: 'SMTP Gateway deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/settings/smtp/gateways/:id/test
const testSmtpGatewayConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let gateway;
    if (isMongo) {
      gateway = await SmtpGateway.findById(id);
    } else {
      gateway = (store.smtpGateways || []).find(g => String(g._id) === String(id));
    }

    if (!gateway) {
      return res.status(404).json({ message: 'SMTP Gateway not found' });
    }

    const transporter = await createTransporter(gateway);
    const isConnected = await verifySMTP(transporter, gateway);

    const connectionStatus = isConnected ? 'Connected' : 'Disconnected';
    gateway.connectionStatus = connectionStatus;
    gateway.lastConnectionTest = new Date();

    if (isMongo) {
      await gateway.save();
    }

    if (isConnected) {
      res.json({
        success: true,
        connectionStatus: 'Connected',
        message: `SMTP Gateway "${gateway.gatewayName}" connected successfully to ${gateway.smtpHost}:${gateway.smtpPort}`
      });
    } else {
      res.status(500).json({
        success: false,
        connectionStatus: 'Disconnected',
        message: `Connection test failed for gateway "${gateway.gatewayName}". Verify credentials and server network.`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: `SMTP Gateway connection error: ${error.message}` });
  }
};

// GET /api/settings/smtp (Backward Compatible)
const getSmtpSettings = async (req, res) => {
  try {
    await ensureDefaultGateway();
    const creds = await getActiveSmtpCredentials();
    const isMongo = getIsConnected();
    let settings = null;

    if (isMongo) {
      settings = await SystemSettings.findOne({ key: 'smtp_config' });
    }

    const batchSize = settings?.batchSize || parseInt(process.env.EMAIL_BATCH_SIZE || '5', 10);
    const delayMs = settings?.delayMs || parseInt(process.env.EMAIL_DELAY_MS || '200', 10);
    const userConfigured = !!creds.user;
    const passConfigured = !!creds.pass;

    const emailDomain = creds.fromEmail ? creds.fromEmail.split('@')[1] : '';
    const isFreeWebmail = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain.toLowerCase());
    const domainStatus = !creds.fromEmail ? 'No Sender Configured' : isFreeWebmail ? 'Custom Domain Not Authenticated (DMARC/SPF Notice)' : 'Custom Domain Authenticated';

    res.json({
      provider: 'Brevo SMTP Relay Pool',
      host: creds.host,
      port: creds.port,
      secure: creds.secure,
      securityLabel: creds.secure ? 'SSL/TLS' : 'STARTTLS',
      fromName: creds.fromName,
      fromEmail: creds.fromEmail,
      batchSize,
      delayMs,
      userConfigured,
      passConfigured,
      connectionStatus: 'Connected',
      domainStatus,
      isCustomDomainAuthenticated: !isFreeWebmail && !!creds.fromEmail
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/settings/smtp
const updateSmtpSettings = async (req, res) => {
  try {
    const { host, port, fromName, fromEmail, batchSize, delayMs } = req.body;

    if (!fromEmail || !fromEmail.includes('@')) {
      return res.status(400).json({ message: 'Valid sender email address is required' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      await SystemSettings.findOneAndUpdate(
        { key: 'smtp_config' },
        {
          key: 'smtp_config',
          smtpHost: host || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
          smtpPort: parseInt(port || '587', 10),
          fromName: fromName || 'Aparaitech Software',
          fromEmail: fromEmail,
          batchSize: parseInt(batchSize || '5', 10),
          delayMs: parseInt(delayMs || '200', 10)
        },
        { upsert: true, new: true }
      );

      // Also sync to first Gateway
      const firstGateway = await SmtpGateway.findOne().sort({ createdAt: 1 });
      if (firstGateway) {
        firstGateway.smtpHost = host || firstGateway.smtpHost;
        firstGateway.smtpPort = parseInt(port || firstGateway.smtpPort, 10);
        firstGateway.fromName = fromName || firstGateway.fromName;
        firstGateway.fromEmail = fromEmail;
        await firstGateway.save();
      }
    } else {
      if (store.smtpGateways && store.smtpGateways.length > 0) {
        store.smtpGateways[0].smtpHost = host || store.smtpGateways[0].smtpHost;
        store.smtpGateways[0].smtpPort = parseInt(port || store.smtpGateways[0].smtpPort, 10);
        store.smtpGateways[0].fromName = fromName || store.smtpGateways[0].fromName;
        store.smtpGateways[0].fromEmail = fromEmail;
      }
    }

    logAudit({
      action: 'UPDATE_SETTINGS',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Updated SMTP settings for sender "${fromName} <${fromEmail}>"`
    });

    res.json({
      message: 'SMTP settings updated successfully',
      settings: { host, port, fromName, fromEmail, batchSize, delayMs }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/settings/smtp/test
const testSmtpConnection = async (req, res) => {
  try {
    const transporter = await createTransporter();
    const isConnected = await verifySMTP(transporter);

    if (isConnected) {
      res.json({
        success: true,
        message: `SMTP Transport connected successfully to ${process.env.SMTP_HOST || 'smtp-relay.brevo.com'}:${process.env.SMTP_PORT || '587'}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'SMTP Transport connection test failed. Verify server network and credentials.'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: `SMTP connection error: ${error.message}` });
  }
};

// POST /api/settings/smtp/send-test
const sendSmtpTestEmail = async (req, res) => {
  try {
    const { targetEmail, gatewayId } = req.body;
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ message: 'Valid recipient test email address is required' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let targetGateway = null;
    if (gatewayId) {
      if (isMongo) {
        targetGateway = await SmtpGateway.findById(gatewayId);
      } else {
        targetGateway = (store.smtpGateways || []).find(g => String(g._id) === String(gatewayId));
      }
    } else {
      if (isMongo) {
        targetGateway = await SmtpGateway.findOne({ isActive: true }).sort({ createdAt: 1 });
      } else {
        targetGateway = (store.smtpGateways || []).find(g => g.isActive !== false);
      }
    }

    const transporter = targetGateway ? await createTransporter(targetGateway) : await createTransporter();
    const fromName = targetGateway?.fromName || 'Aparaitech Software';
    const fromEmail = targetGateway?.fromEmail || process.env.SMTP_FROM_EMAIL;

    const result = await sendSingleEmail(transporter, {
      to: targetEmail,
      subject: `Aparaitech SMTP Test [${targetGateway?.gatewayName || 'Primary Gateway'}]`,
      fromName,
      fromEmail,
      text: `Hello,\n\nThis is a real SMTP gateway test email dispatched via ${targetGateway?.gatewayName || 'Primary Gateway'} from Aparaitech Software.\n\nRegards,\nAparaitech Software Recruitment Team`,
      html: `<p>Hello,</p><p>This is a real SMTP gateway test email dispatched via <strong>${targetGateway?.gatewayName || 'Primary Gateway'}</strong> from Aparaitech Software.</p><p>Regards,<br>Aparaitech Software Recruitment Team</p>`
    });

    if (result.success) {
      if (targetGateway) {
        targetGateway.lastConnectionTest = new Date();
        targetGateway.connectionStatus = 'Connected';
        if (isMongo) await targetGateway.save();
      }

      res.json({
        message: 'SMTP accepted the test email. Final inbox placement depends on recipient mail provider.',
        messageId: result.messageId,
        smtpResponse: result.smtpResponse,
        accepted: result.accepted,
        rejected: result.rejected,
        sender: result.from,
        recipient: targetEmail,
        gatewayName: targetGateway?.gatewayName || 'Primary Gateway',
        gatewayId: targetGateway?._id || null
      });
    } else {
      res.status(500).json({ 
        message: result.error || `SMTP test email dispatch failed for ${targetGateway?.gatewayName || 'gateway'}. Verify SMTP credentials.` 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/settings/smtp/delivery-status/:messageId
const getDeliveryStatus = async (req, res) => {
  try {
    const queryParam = decodeURIComponent(req.params.messageId);
    const isMongo = getIsConnected();
    let log = null;

    if (isMongo) {
      if (queryParam.match(/^[0-9a-fA-F]{24}$/)) {
        log = await EmailLog.findById(queryParam);
      }
      if (!log) {
        log = await EmailLog.findOne({ messageId: queryParam });
      }
    }

    const messageId = log?.messageId || queryParam;
    const recipient = log?.recipientEmail || 'N/A';
    const localStatus = log?.status || 'Unknown';
    const smtpResponse = log?.smtpResponse || '';
    const timestamp = log?.sentAt || log?.createdAt || new Date();
    const reason = log?.errorMessage || log?.failureReason || '';

    const apiKey = process.env.SMTP_PASS; // Brevo API Key
    let brevoEvent = null;
    let brevoApiError = null;

    if (apiKey && apiKey.startsWith('xkeysib-') && messageId && messageId.includes('@')) {
      try {
        const brevoRes = await axios.get('https://api.brevo.com/v3/smtp/statistics/events', {
          headers: { 'api-key': apiKey },
          params: { messageId, limit: 5 }
        });
        if (brevoRes.data && brevoRes.data.events && brevoRes.data.events.length > 0) {
          brevoEvent = brevoRes.data.events[0];
        }
      } catch (err) {
        brevoApiError = err.response?.data?.message || err.message;
        console.log('[BREVO API EVENT QUERY NOTICE]:', brevoApiError);
      }
    }

    let diagnosis = 'SMTP delivery status verified.';
    let brevoStatus = brevoEvent?.event || 'ACCEPTED_BY_SMTP';

    if (reason && reason.includes('535 5.7.8')) {
      brevoStatus = 'SMTP_AUTH_FAILED';
      diagnosis = 'Brevo SMTP authentication failed (535 5.7.8). Ensure SMTP_PASS in .env is a valid Brevo SMTP key generated from Brevo Dashboard > SMTP & API.';
    } else if (brevoEvent?.event === 'delivered') {
      brevoStatus = 'DELIVERED';
      diagnosis = 'Brevo confirms delivery to recipient mail server. If email is missing from Gmail, check Gmail Spam/Promotions or domain DMARC alignment.';
    } else if (brevoEvent?.event === 'soft_bounce' || brevoEvent?.event === 'hard_bounce' || brevoEvent?.event === 'blocked') {
      brevoStatus = brevoEvent.event.toUpperCase();
      diagnosis = `Brevo reported ${brevoEvent.event}: ${brevoEvent.reason || 'Blocked by provider'}`;
    } else if (brevoApiError && brevoApiError.includes('unrecognised IP')) {
      diagnosis = 'Brevo REST API requires adding current IP to Authorized IPs in Brevo Security Settings (https://app.brevo.com/security/authorised_ips).';
    } else if (!messageId) {
      brevoStatus = 'MESSAGE_ID_MISSING';
      diagnosis = 'No Message ID recorded. SMTP dispatch did not complete successfully.';
    }

    res.json({
      messageId,
      recipient,
      localStatus,
      brevoStatus,
      brevoEvent: brevoEvent?.event || (reason ? 'failed' : 'accepted'),
      reason: brevoEvent?.reason || reason || smtpResponse || 'Accepted by Brevo SMTP Relay',
      timestamp,
      diagnosis,
      brevoVerified: !!brevoEvent,
      gatewayName: log?.gatewayName || ''
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getSmtpSettings, 
  updateSmtpSettings, 
  testSmtpConnection, 
  sendSmtpTestEmail, 
  getDeliveryStatus,
  getSmtpGateways,
  createSmtpGateway,
  updateSmtpGateway,
  deleteSmtpGateway,
  testSmtpGatewayConnection,
  ensureDefaultGateway,
  getGatewayDailyUsage
};

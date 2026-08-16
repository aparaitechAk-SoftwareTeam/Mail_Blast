const SystemSettings = require('../models/SystemSettings');
const { createTransporter, verifySMTP, sendSingleEmail, getActiveSmtpCredentials } = require('../config/mailer');
const { getIsConnected } = require('../config/db');
const { logAudit } = require('../services/auditService');

const getSmtpSettings = async (req, res) => {
  try {
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
      provider: 'Brevo SMTP Relay',
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

const updateSmtpSettings = async (req, res) => {
  try {
    const { host, port, fromName, fromEmail, batchSize, delayMs } = req.body;

    if (!fromEmail || !fromEmail.includes('@')) {
      return res.status(400).json({ message: 'Valid sender email address is required' });
    }

    const isMongo = getIsConnected();
    let settings;

    if (isMongo) {
      settings = await SystemSettings.findOneAndUpdate(
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
    }

    logAudit({
      action: 'UPDATE_SETTINGS',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Updated SMTP settings for sender "${fromName} <${fromEmail}>"`
    });

    res.json({
      message: 'SMTP settings updated successfully',
      settings: {
        host: host || process.env.SMTP_HOST,
        port: port || process.env.SMTP_PORT,
        fromName,
        fromEmail,
        batchSize,
        delayMs
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

const sendSmtpTestEmail = async (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ message: 'Valid recipient test email address is required' });
    }

    const transporter = await createTransporter();
    const result = await sendSingleEmail(transporter, {
      to: targetEmail,
      subject: 'Aparaitech SMTP Configuration Test',
      text: 'Hello,\n\nThis is a real SMTP configuration test from Aparaitech Software Student Email Blast Settings.\n\nRegards,\nAparaitech Software Recruitment Team',
      html: '<p>Hello,</p><p>This is a real SMTP configuration test from <strong>Aparaitech Software Student Email Blast Settings</strong>.</p><p>Regards,<br>Aparaitech Software Recruitment Team</p>'
    });

    if (result.success) {
      res.json({
        message: 'SMTP accepted the test email. Final inbox placement depends on the recipient mail provider.',
        messageId: result.messageId,
        smtpResponse: result.smtpResponse,
        accepted: result.accepted,
        rejected: result.rejected,
        sender: result.from,
        recipient: targetEmail
      });
    } else {
      res.status(500).json({ message: `SMTP test email dispatch failed: ${result.error}` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const EmailLog = require('../models/EmailLog');
const axios = require('axios');

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
      brevoVerified: !!brevoEvent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSmtpSettings, updateSmtpSettings, testSmtpConnection, sendSmtpTestEmail, getDeliveryStatus };

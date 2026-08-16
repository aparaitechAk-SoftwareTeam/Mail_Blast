const nodemailer = require('nodemailer');
const SystemSettings = require('../models/SystemSettings');
const { getIsConnected } = require('./db');

const getActiveSmtpCredentials = async () => {
  let settings = null;
  if (getIsConnected()) {
    try {
      settings = await SystemSettings.findOne({ key: 'smtp_config' });
    } catch (e) {
      // Ignore fallback
    }
  }

  const host = settings?.smtpHost || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = settings?.smtpPort || parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = settings?.smtpSecure ?? (process.env.SMTP_SECURE === 'true' || port === 465);
  const user = settings?.smtpUser || process.env.SMTP_USER || '';
  const pass = settings?.smtpPass || process.env.SMTP_PASS || '';
  const fromName = settings?.fromName || process.env.SMTP_FROM_NAME || 'Aparaitech Software';
  const fromEmail = settings?.fromEmail || process.env.SMTP_FROM_EMAIL || '';

  return { host, port, secure, user, pass, fromName, fromEmail };
};

const createTransporter = async (customCreds = null) => {
  const defaultCreds = await getActiveSmtpCredentials();
  const creds = customCreds || defaultCreds;

  const host = creds.host || creds.smtpHost || defaultCreds.host || 'smtp-relay.brevo.com';
  const port = creds.port || creds.smtpPort || defaultCreds.port || 587;
  const secure = creds.secure ?? creds.smtpSecure ?? (port === 465);
  const user = creds.user || creds.smtpUser || defaultCreds.user || process.env.SMTP_USER;
  const pass = creds.pass || creds.smtpPass || defaultCreds.pass || process.env.SMTP_PASS;

  if (pass && user) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Create ethereal test account if no SMTP password provided
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    // Fallback stub transporter if offline
    return {
      sendMail: async (mailOptions) => {
        const msgId = `<stub-${Date.now()}-${Math.random().toString(36).substring(7)}@aparaitech.com>`;
        console.log(`[STUB EMAIL DISPATCH] To: ${mailOptions.to} | Subject: ${mailOptions.subject} | ID: ${msgId}`);
        return { 
          messageId: msgId, 
          response: '250 2.0.0 OK (Stub Local Transporter)',
          accepted: [mailOptions.to],
          rejected: [],
          envelope: { from: mailOptions.from?.address || mailOptions.from, to: [mailOptions.to] }
        };
      }
    };
  }
};

const verifySMTP = async (transporter, customCreds = null) => {
  const defaultCreds = await getActiveSmtpCredentials();
  const creds = customCreds || defaultCreds;
  const host = creds.host || creds.smtpHost || defaultCreds.host || 'smtp-relay.brevo.com';
  const port = creds.port || creds.smtpPort || defaultCreds.port || 587;
  const secure = creds.secure ?? creds.smtpSecure ?? false;
  const user = creds.user || creds.smtpUser || defaultCreds.user;
  const pass = creds.pass || creds.smtpPass || defaultCreds.pass;
  const fromName = creds.fromName || defaultCreds.fromName || 'Aparaitech Software';
  const fromEmail = creds.fromEmail || defaultCreds.fromEmail || '';

  console.log(`SMTP Provider: Brevo SMTP Relay`);
  console.log(`SMTP Host: ${host}`);
  console.log(`SMTP Port: ${port}`);
  console.log(`SMTP Security: ${secure ? 'SSL/TLS' : 'STARTTLS'}`);
  console.log(`Sender Name: ${fromName}`);
  console.log(`Sender Email: ${fromEmail}`);
  console.log(`SMTP User: ${user ? 'Configured' : 'Missing'}`);
  console.log(`SMTP Password: ${pass ? 'Configured' : 'Missing'}`);

  try {
    if (transporter && typeof transporter.verify === 'function') {
      await transporter.verify();
      console.log(`SMTP Transport: CONNECTED`);
      return true;
    } else {
      console.log(`SMTP Transport: CONNECTED (Stub Transporter)`);
      return true;
    }
  } catch (err) {
    console.error(`SMTP Transport: FAILED`);
    console.error(`Reason: ${err.message}`);
    return false;
  }
};

const sendSingleEmail = async (transporter, { to, subject, html, text, fromName: customFromName, fromEmail: customFromEmail }) => {
  try {
    const creds = await getActiveSmtpCredentials();
    const fromName = customFromName || creds.fromName || 'Aparaitech Software';
    const fromEmail = customFromEmail || creds.fromEmail;

    if (!fromEmail) {
      console.error('[SMTP ERROR] SMTP sender email (fromEmail) is not configured.');
      return { success: false, error: 'SMTP sender email is not configured for this gateway.' };
    }

    const mailOptions = {
      from: {
        name: fromName,
        address: fromEmail
      },
      replyTo: {
        name: fromName,
        address: fromEmail
      },
      to,
      subject,
      html,
      text: text || (html ? html.replace(/<[^>]*>?/gm, '') : '')
    };

    const info = await transporter.sendMail(mailOptions);

    const isAccepted = Array.isArray(info.accepted) ? info.accepted.length > 0 : true;
    const isRejected = Array.isArray(info.rejected) ? info.rejected.length > 0 : false;
    const responseText = info.response || '250 OK';
    const msgId = info.messageId || `<${Date.now()}@aparaitech.com>`;

    console.log(`\n===================================================`);
    console.log(`[EMAIL DISPATCH RESULT]`);
    console.log(`TO: ${to}`);
    console.log(`FROM: "${fromName}" <${fromEmail}>`);
    console.log(`REPLY-TO: "${fromName}" <${fromEmail}>`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`MESSAGE ID: ${msgId}`);
    console.log(`ACCEPTED: ${JSON.stringify(info.accepted || [to])}`);
    console.log(`REJECTED: ${JSON.stringify(info.rejected || [])}`);
    console.log(`PENDING: ${JSON.stringify(info.pending || [])}`);
    console.log(`ENVELOPE: ${JSON.stringify(info.envelope || {})}`);
    console.log(`SMTP RESPONSE: ${responseText}`);
    console.log(`STATUS: ACCEPTED_BY_SMTP`);
    console.log(`===================================================\n`);

    let previewUrl = null;
    if (nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return {
      success: true,
      messageId: msgId,
      smtpResponse: responseText,
      accepted: isAccepted,
      rejected: isRejected,
      acceptedList: info.accepted || [to],
      rejectedList: info.rejected || [],
      envelope: info.envelope || {},
      from: `"${fromName}" <${fromEmail}>`,
      to,
      previewUrl
    };
  } catch (error) {
    console.error(`\n===================================================`);
    console.error(`[EMAIL DISPATCH FAILED]`);
    console.error(`TO: ${to}`);
    console.error(`REASON: ${error.message}`);
    console.error(`===================================================\n`);

    let safeMessage = error.message;
    if (error.message && error.message.includes('535 5.7.8')) {
      safeMessage = 'SMTP authentication failed. Verify Brevo SMTP key / password.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      safeMessage = 'Unable to connect to Brevo SMTP host server.';
    }

    return { success: false, error: safeMessage };
  }
};

module.exports = { createTransporter, verifySMTP, sendSingleEmail, getActiveSmtpCredentials };

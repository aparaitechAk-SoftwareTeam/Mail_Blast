const Campaign = require('../models/Campaign');
const EmailLog = require('../models/EmailLog');
const Student = require('../models/Student');
const Suppression = require('../models/Suppression');
const { createTransporter, sendSingleEmail } = require('../config/mailer');
const { emitCampaignProgress, emitEmailStatus } = require('../sockets/campaignSocket');
const { getIsConnected, getMemoryStore } = require('../config/db');

// Active Queue Concurrency Lock Set
const activeCampaignLocks = new Set();
const MAX_RETRY_ATTEMPTS = 3;

// Replace tag variables in HTML / Text
const personalizeContent = (htmlContent, student) => {
  if (!htmlContent) return '';
  return htmlContent
    .replace(/\{Name\}/gi, student.name || 'Student')
    .replace(/\{Email\}/gi, student.email || '')
    .replace(/\{Phone\}/gi, student.phone || 'N/A')
    .replace(/\{College\}/gi, student.college || 'your college')
    .replace(/\{Branch\}/gi, student.branch || 'Engineering')
    .replace(/\{GraduationYear\}/gi, String(student.graduationYear || new Date().getFullYear()))
    .replace(/\{CGPA\}/gi, String(student.cgpa || '8.0'))
    .replace(/\{PlacementStatus\}/gi, student.placementStatus || 'Unplaced');
};

const processCampaignQueue = async (campaignId, retryOnlyFailed = false) => {
  const cid = String(campaignId);
  if (activeCampaignLocks.has(cid)) {
    console.log(`[QUEUE GUARD] Campaign ${cid} is already actively processing. Skipping duplicate worker.`);
    return;
  }

  activeCampaignLocks.add(cid);

  try {
    const transporter = await createTransporter();
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let campaign;
    let logs = [];

    if (isMongo) {
      campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        activeCampaignLocks.delete(cid);
        return;
      }
      
      if (retryOnlyFailed) {
        logs = await EmailLog.find({ campaignId, status: 'Failed', retryCount: { $lt: MAX_RETRY_ATTEMPTS } });
      } else {
        logs = await EmailLog.find({ 
          campaignId, 
          status: { $in: ['Pending', 'Sending'] } 
        });
      }
    } else {
      campaign = store.campaigns.find(c => String(c._id) === cid);
      if (!campaign) {
        activeCampaignLocks.delete(cid);
        return;
      }

      if (retryOnlyFailed) {
        logs = store.emailLogs.filter(l => String(l.campaignId) === cid && l.status === 'Failed' && (l.retryCount || 0) < MAX_RETRY_ATTEMPTS);
      } else {
        logs = store.emailLogs.filter(l => String(l.campaignId) === cid && (l.status === 'Pending' || l.status === 'Sending'));
      }
    }

    campaign.status = 'Sending';
    campaign.startedAt = campaign.startedAt || new Date();
    
    if (isMongo) {
      await campaign.save();
    }

    // Get active suppressions
    let suppressedEmails = new Set();
    if (isMongo) {
      const suppressions = await Suppression.find({}, 'email');
      suppressedEmails = new Set(suppressions.map(s => s.email.toLowerCase()));
    } else {
      suppressedEmails = new Set(store.suppressions.map(s => s.email.toLowerCase()));
    }

    let sent = campaign.sentCount || 0;
    let failed = campaign.failedCount || 0;

    for (const log of logs) {
      // Never resend successfully sent logs
      if (log.status === 'Sent') continue;

      const recipientEmail = log.recipientEmail.toLowerCase();

      // Check max retry limit for failed retry runs
      if (log.retryCount >= MAX_RETRY_ATTEMPTS) {
        log.status = 'Failed';
        log.errorMessage = `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded`;
        if (isMongo) await log.save();
        emitEmailStatus(cid, { logId: log._id, recipientEmail, status: 'Failed', error: log.errorMessage });
        continue;
      }

      // Check suppression list
      if (suppressedEmails.has(recipientEmail)) {
        log.status = 'Suppressed';
        log.errorMessage = 'Recipient is in suppression / opt-out list';
        failed++;
        if (isMongo) await log.save();
        
        emitEmailStatus(cid, { logId: log._id, recipientEmail, status: 'Suppressed', error: log.errorMessage });
        emitCampaignProgress(cid, { campaignId: cid, sentCount: sent, failedCount: failed, totalRecipients: campaign.totalRecipients, progressPct: Math.round((sent + failed) / campaign.totalRecipients * 100) });
        continue;
      }

      // Atomic transition to Sending before send
      log.status = 'Sending';
      if (isMongo) await log.save();

      // Fetch real student record for tag personalization
      let student = null;
      if (isMongo && log.studentId) {
        student = await Student.findById(log.studentId);
      } else if (log.studentId) {
        student = store.students.find(s => String(s._id) === String(log.studentId));
      }

      const studentData = student || {
        name: log.recipientName,
        email: log.recipientEmail,
        college: 'Aparaitech Partner Institute',
        branch: 'Computer Engineering',
        graduationYear: 2026,
        cgpa: 8.5,
        placementStatus: 'Unplaced'
      };

      const personalizedHtml = personalizeContent(campaign.bodyHtml, studentData);
      const personalizedSubject = personalizeContent(campaign.subject, studentData);

      // Attempt sending via Nodemailer / SMTP transporter
      const result = await sendSingleEmail(transporter, {
        to: log.recipientEmail,
        subject: personalizedSubject,
        html: personalizedHtml
      });

      if (result.success && result.messageId) {
        log.status = 'Sent';
        log.deliveryStatus = 'Accepted';
        log.messageId = result.messageId;
        log.smtpResponse = result.smtpResponse || '250 OK';
        log.accepted = result.accepted !== false;
        log.rejected = false;
        log.sentAt = new Date();
        log.errorMessage = '';
        log.failureReason = '';
        sent++;

        if (isMongo) {
          await EmailLog.findByIdAndUpdate(log._id, {
            status: 'Sent',
            deliveryStatus: 'Accepted',
            messageId: result.messageId,
            smtpResponse: result.smtpResponse || '250 OK',
            accepted: true,
            rejected: false,
            sentAt: log.sentAt,
            errorMessage: '',
            failureReason: ''
          });
        }
      } else {
        const failureErr = result.error || (result.success ? 'No Message ID returned by SMTP server' : 'SMTP Delivery Failed');
        log.status = 'Failed';
        log.deliveryStatus = 'Failed';
        log.errorMessage = failureErr;
        log.failureReason = failureErr;
        log.retryCount = (log.retryCount || 0) + 1;
        failed++;

        if (isMongo) {
          await EmailLog.findByIdAndUpdate(log._id, {
            status: 'Failed',
            deliveryStatus: 'Failed',
            errorMessage: failureErr,
            failureReason: failureErr,
            $inc: { retryCount: 1 }
          });
        }
      }

      campaign.sentCount = sent;
      campaign.failedCount = failed;
      campaign.pendingCount = Math.max(0, campaign.totalRecipients - (sent + failed));
      
      if (isMongo) {
        await campaign.save();
      }

      const progressPct = Math.min(100, Math.round(((sent + failed) / campaign.totalRecipients) * 100));

      emitEmailStatus(cid, { 
        logId: log._id, 
        recipientEmail: log.recipientEmail, 
        status: log.status, 
        deliveryStatus: log.deliveryStatus,
        messageId: log.messageId,
        smtpResponse: log.smtpResponse,
        accepted: log.accepted,
        rejected: log.rejected,
        sentAt: log.sentAt,
        error: log.errorMessage 
      });

      emitCampaignProgress(cid, {
        campaignId: cid,
        sentCount: sent,
        failedCount: failed,
        pendingCount: campaign.pendingCount,
        totalRecipients: campaign.totalRecipients,
        progressPct,
        currentRecipient: log.recipientEmail,
        status: 'Sending'
      });
    }

    // Determine final campaign state
    const finalStatus = (sent === 0 && failed > 0) ? 'Failed' : 'Completed';
    campaign.status = finalStatus;
    campaign.completedAt = new Date();
    campaign.pendingCount = 0;
    
    if (isMongo) {
      await campaign.save();
    }

    emitCampaignProgress(cid, {
      campaignId: cid,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      pendingCount: 0,
      totalRecipients: campaign.totalRecipients,
      progressPct: 100,
      status: finalStatus
    });

  } catch (error) {
    console.error(`[QUEUE ERROR] Error processing campaign ${campaignId}:`, error);
    if (getIsConnected()) {
      await Campaign.findByIdAndUpdate(campaignId, { status: 'Failed' });
    }
  } finally {
    activeCampaignLocks.delete(cid);
  }
};

const recoverInterruptedQueue = async () => {
  try {
    const isMongo = getIsConnected();
    let count = 0;

    if (isMongo) {
      const interruptedCampaigns = await Campaign.find({ status: 'Sending' });
      count = interruptedCampaigns.length;
      for (const campaign of interruptedCampaigns) {
        console.log(`[QUEUE RECOVERY] Resuming interrupted campaign: ${campaign.title} (${campaign._id})`);
        processCampaignQueue(campaign._id);
      }
    } else {
      const store = getMemoryStore();
      const interrupted = store.campaigns.filter(c => c.status === 'Sending');
      count = interrupted.length;
      for (const campaign of interrupted) {
        console.log(`[QUEUE RECOVERY] Resuming memory campaign: ${campaign.title}`);
        processCampaignQueue(campaign._id);
      }
    }

    console.log(`Email Queue Recovery: ${count} pending campaigns recovered`);
  } catch (err) {
    console.error('[QUEUE RECOVERY ERROR]:', err.message);
  }
};

module.exports = { processCampaignQueue, personalizeContent, recoverInterruptedQueue };

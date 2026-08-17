const Campaign = require('../models/Campaign');
const EmailLog = require('../models/EmailLog');
const Student = require('../models/Student');
const Suppression = require('../models/Suppression');
const SmtpGateway = require('../models/SmtpGateway');
const { createTransporter, sendSingleEmail, getActiveSmtpCredentials } = require('../config/mailer');
const { emitCampaignProgress, emitEmailStatus } = require('../sockets/campaignSocket');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { getStartOfTodayIST, getTodayISTDateString } = require('../utils/dateUtils');

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

// Calculate today's sent count for a specific gateway directly from SmtpGateway record (authoritative source of truth)
const getGatewayDailyUsage = async (gatewayId) => {
  const { ensureGatewayDailyReset } = require('../controllers/settingsController');
  const gwDoc = await ensureGatewayDailyReset(gatewayId);
  return gwDoc ? (gwDoc.dailyUsed || 0) : 0;
};

const processCampaignQueue = async (campaignId, retryOnlyFailed = false) => {
  const cid = String(campaignId);
  if (activeCampaignLocks.has(cid)) {
    console.log(`[QUEUE GUARD] Campaign ${cid} is already actively processing. Skipping duplicate worker.`);
    return;
  }

  activeCampaignLocks.add(cid);

  try {
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

    // 1. Resolve selected SMTP Gateway
    let gateway = null;
    if (campaign.smtpGatewayId) {
      if (isMongo) {
        gateway = await SmtpGateway.findById(campaign.smtpGatewayId);
      } else {
        gateway = (store.smtpGateways || []).find(g => String(g._id) === String(campaign.smtpGatewayId));
      }
    }

    // Fallback to first active gateway if campaign has no selected gateway or gateway was deleted
    if (!gateway) {
      if (isMongo) {
        gateway = await SmtpGateway.findOne({ isActive: true }).sort({ createdAt: 1 });
      } else {
        gateway = (store.smtpGateways || []).find(g => g.isActive !== false);
      }
    }

    // 2. Validate Gateway status & credentials
    if (gateway && gateway.isActive === false) {
      console.error(`[QUEUE ERROR] Selected gateway "${gateway.gatewayName}" is currently disabled/inactive.`);
      campaign.status = 'Failed';
      if (isMongo) await campaign.save();
      emitCampaignProgress(cid, { campaignId: cid, status: 'Failed', error: 'Selected SMTP Gateway is disabled' });
      activeCampaignLocks.delete(cid);
      return;
    }

    // 3. Calculate Gateway capacity & quota
    const dailyQuota = gateway?.dailyQuota || 300;
    const dailyUsage = await getGatewayDailyUsage(gateway?._id);
    let remainingCapacity = Math.max(0, dailyQuota - dailyUsage);

    console.log(`[QUEUE GATEWAY INITIALIZED] Gateway: "${gateway?.gatewayName || 'Default Brevo Gateway'}" | Quota: ${dailyQuota} | Today's Usage: ${dailyUsage} | Remaining: ${remainingCapacity}`);

    // Create Nodemailer Transporter for this specific Gateway
    const transporter = gateway ? await createTransporter(gateway) : await createTransporter();

    campaign.status = 'Sending';
    campaign.startedAt = campaign.startedAt || new Date();
    if (!campaign.smtpGatewayName && gateway) {
      campaign.smtpGatewayName = gateway.gatewayName;
      campaign.smtpGatewayId = gateway._id;
    }
    
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
        emitEmailStatus(cid, { logId: log._id, recipientEmail, status: 'Failed', error: log.errorMessage, gatewayId: gateway?._id, gatewayName: gateway?.gatewayName });
        continue;
      }

      // Check suppression list
      if (suppressedEmails.has(recipientEmail)) {
        log.status = 'Suppressed';
        log.errorMessage = 'Recipient is in suppression / opt-out list';
        failed++;
        if (isMongo) await log.save();
        
        emitEmailStatus(cid, { logId: log._id, recipientEmail, status: 'Suppressed', error: log.errorMessage, gatewayId: gateway?._id, gatewayName: gateway?.gatewayName });
        emitCampaignProgress(cid, { campaignId: cid, sentCount: sent, failedCount: failed, totalRecipients: campaign.totalRecipients, progressPct: Math.round((sent + failed) / campaign.totalRecipients * 100) });
        continue;
      }

      // 1. Get current pool of eligible gateways (not exhausted, active, connected)
      const { getEligibleGatewayPool, incrementGatewayUsage } = require('../controllers/settingsController');
      let eligiblePool = await getEligibleGatewayPool();

      // If campaign selected a specific gateway and it is in eligible pool, put it first
      if (campaign.smtpGatewayId) {
        const campaignGwStr = String(campaign.smtpGatewayId);
        const targetIdx = eligiblePool.findIndex(g => String(g._id) === campaignGwStr);
        if (targetIdx > 0) {
          const targetedGw = eligiblePool.splice(targetIdx, 1)[0];
          eligiblePool.unshift(targetedGw);
        }
      }

      if (eligiblePool.length === 0) {
        console.warn(`[GATEWAY POOL EXHAUSTED] All SMTP gateways in pool are exhausted, disabled, or disconnected. Leaving recipient pending.`);
        log.status = 'Pending';
        log.errorMessage = `Pending — No eligible SMTP gateway available with daily quota`;
        if (isMongo) await log.save();

        emitEmailStatus(cid, { logId: log._id, recipientEmail, status: 'Pending', error: log.errorMessage });
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

      let sendSuccess = false;
      let lastAttemptErr = '';
      let successfulGw = null;

      // 2. Loop through eligible gateways in failover order
      for (const currentGw of eligiblePool) {
        const quota = currentGw.dailyQuota || 300;
        const used = currentGw.dailyUsed || 0;
        if (used >= quota) {
          console.warn(`[GATEWAY EXHAUSTED] Gateway "${currentGw.gatewayName}" (${used}/${quota}) limit reached. Trying next eligible gateway...`);
          continue;
        }

        try {
          const currentTransporter = await createTransporter(currentGw);
          const result = await sendSingleEmail(currentTransporter, {
            to: log.recipientEmail,
            subject: personalizedSubject,
            html: personalizedHtml,
            fromName: currentGw.fromName,
            fromEmail: currentGw.fromEmail
          });

          if (result.success && result.messageId) {
            sendSuccess = true;
            successfulGw = currentGw;
            log.status = 'Sent';
            log.deliveryStatus = 'Accepted';
            log.messageId = result.messageId;
            log.smtpResponse = result.smtpResponse || '250 OK';
            log.accepted = result.accepted !== false;
            log.rejected = false;
            log.sentAt = new Date();
            log.errorMessage = '';
            log.failureReason = '';
            log.gatewayId = currentGw._id;
            log.gatewayName = currentGw.gatewayName;
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
                failureReason: '',
                gatewayId: currentGw._id,
                gatewayName: currentGw.gatewayName
              });
            }

            // Atomically increment ONLY the gateway that successfully delivered the email
            await incrementGatewayUsage(currentGw._id);
            break; // Break failover loop on success!
          } else {
            lastAttemptErr = result.error || 'SMTP delivery failed';
            console.warn(`[GATEWAY FAILOVER NOTICE] Gateway "${currentGw.gatewayName}" failed send: ${lastAttemptErr}. Attempting failover...`);
          }
        } catch (gwErr) {
          lastAttemptErr = gwErr.message;
          console.warn(`[GATEWAY EXCEPTION NOTICE] Gateway "${currentGw.gatewayName}" error: ${lastAttemptErr}. Attempting failover...`);
        }
      }

      if (!sendSuccess) {
        log.status = 'Failed';
        log.deliveryStatus = 'Failed';
        log.errorMessage = lastAttemptErr || 'Dispatch failed via all available SMTP gateways';
        log.failureReason = lastAttemptErr || 'All gateway attempts failed';
        log.retryCount = (log.retryCount || 0) + 1;
        failed++;

        if (isMongo) {
          await EmailLog.findByIdAndUpdate(log._id, {
            status: 'Failed',
            deliveryStatus: 'Failed',
            errorMessage: log.errorMessage,
            failureReason: log.failureReason,
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
        error: log.errorMessage,
        gatewayId: gateway?._id,
        gatewayName: gateway?.gatewayName
      });

      emitCampaignProgress(cid, {
        campaignId: cid,
        sentCount: sent,
        failedCount: failed,
        pendingCount: campaign.pendingCount,
        totalRecipients: campaign.totalRecipients,
        progressPct,
        currentRecipient: log.recipientEmail,
        status: 'Sending',
        gatewayId: gateway?._id,
        gatewayName: gateway?.gatewayName
      });
    }

    // Determine final campaign state
    const pendingRemaining = campaign.totalRecipients - (sent + failed);
    const finalStatus = (sent === 0 && failed > 0) ? 'Failed' : 'Completed';
    campaign.status = finalStatus;
    campaign.completedAt = new Date();
    campaign.pendingCount = Math.max(0, pendingRemaining);
    
    if (isMongo) {
      await campaign.save();
    }

    emitCampaignProgress(cid, {
      campaignId: cid,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      pendingCount: campaign.pendingCount,
      totalRecipients: campaign.totalRecipients,
      progressPct: Math.round(((sent + failed) / campaign.totalRecipients) * 100),
      status: finalStatus,
      gatewayId: gateway?._id,
      gatewayName: gateway?.gatewayName
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

module.exports = { processCampaignQueue, personalizeContent, recoverInterruptedQueue, getGatewayDailyUsage };

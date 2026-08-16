const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const { processCampaignQueue } = require('./emailQueueService');
const { getIsConnected, getMemoryStore } = require('../config/db');

const initScheduler = () => {
  // Check for scheduled campaigns every 1 minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const isMongo = getIsConnected();

      if (isMongo) {
        const dueCampaigns = await Campaign.find({
          status: 'Scheduled',
          scheduledAt: { $lte: now }
        });

        for (const campaign of dueCampaigns) {
          console.log(`[SCHEDULER] Triggering scheduled campaign: ${campaign.title} (${campaign._id})`);
          processCampaignQueue(campaign._id);
        }
      } else {
        const store = getMemoryStore();
        const due = store.campaigns.filter(c => c.status === 'Scheduled' && c.scheduledAt && new Date(c.scheduledAt) <= now);
        for (const campaign of due) {
          console.log(`[SCHEDULER] Triggering scheduled campaign in memory: ${campaign.title}`);
          processCampaignQueue(campaign._id);
        }
      }
    } catch (error) {
      console.error('[SCHEDULER ERROR]:', error.message);
    }
  });

  console.log('Campaign Cron Scheduler Service Active');
};

module.exports = { initScheduler };

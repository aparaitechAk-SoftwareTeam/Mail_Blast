const Campaign = require('../models/Campaign');
const Student = require('../models/Student');
const EmailLog = require('../models/EmailLog');
const Suppression = require('../models/Suppression');
const { getIsConnected, getMemoryStore } = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let totalStudents = 0;
    let totalCampaigns = 0;
    let totalEmailsSent = 0;
    let totalFailedEmails = 0;
    let collegeDistribution = [];
    let recentCampaigns = [];

    if (isMongo) {
      totalStudents = await Student.countDocuments();
      totalCampaigns = await Campaign.countDocuments();

      const campaignStats = await Campaign.aggregate([
        {
          $group: {
            _id: null,
            sentSum: { $sum: '$sentCount' },
            failedSum: { $sum: '$failedCount' }
          }
        }
      ]);

      if (campaignStats.length > 0) {
        totalEmailsSent = campaignStats[0].sentSum || 0;
        totalFailedEmails = campaignStats[0].failedSum || 0;
      }

      collegeDistribution = await Student.aggregate([
        { $group: { _id: '$college', count: { $sum: 1 } } },
        { $project: { college: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]);

      recentCampaigns = await Campaign.find()
        .sort({ createdAt: -1 })
        .limit(5);

    } else {
      totalStudents = store.students.length;
      totalCampaigns = store.campaigns.length;
      totalEmailsSent = store.campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
      totalFailedEmails = store.campaigns.reduce((acc, c) => acc + (c.failedCount || 0), 0);

      const collegeMap = {};
      store.students.forEach(s => {
        collegeMap[s.college] = (collegeMap[s.college] || 0) + 1;
      });

      collegeDistribution = Object.keys(collegeMap).map(col => ({
        college: col,
        count: collegeMap[col]
      })).sort((a, b) => b.count - a.count);

      recentCampaigns = store.campaigns.slice(0, 5);
    }

    const successRate = (totalEmailsSent + totalFailedEmails) > 0 
      ? Math.round((totalEmailsSent / (totalEmailsSent + totalFailedEmails)) * 100) 
      : null;

    res.json({
      summary: {
        totalStudents,
        totalCampaigns,
        totalEmailsSent,
        totalFailedEmails,
        successRate
      },
      collegeDistribution,
      recentCampaigns
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDetailedReports = async (req, res) => {
  try {
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let campaigns = [];
    if (isMongo) {
      campaigns = await Campaign.find().sort({ createdAt: -1 });
    } else {
      campaigns = store.campaigns;
    }

    const timelineData = campaigns.slice(0, 7).map(c => ({
      name: c.title.length > 18 ? c.title.substring(0, 18) + '...' : c.title,
      sent: c.sentCount || 0,
      failed: c.failedCount || 0
    })).reverse();

    res.json({
      campaigns,
      timelineData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getDetailedReports };

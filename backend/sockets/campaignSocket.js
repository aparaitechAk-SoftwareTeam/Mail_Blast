let ioInstance = null;

const initCampaignSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Client Connected to Campaign Sockets: ${socket.id}`);

    socket.on('join:campaign', (campaignId) => {
      socket.join(`campaign_${campaignId}`);
      console.log(`Socket ${socket.id} joined room campaign_${campaignId}`);
    });

    socket.on('leave:campaign', (campaignId) => {
      socket.leave(`campaign_${campaignId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client Disconnected: ${socket.id}`);
    });
  });
};

const emitCampaignProgress = (campaignId, data) => {
  if (ioInstance) {
    ioInstance.to(`campaign_${campaignId}`).emit('campaign:progress', data);
    ioInstance.emit('campaign:global-progress', { campaignId, ...data });
  }
};

const emitEmailStatus = (campaignId, data) => {
  if (ioInstance) {
    ioInstance.to(`campaign_${campaignId}`).emit('campaign:email-status', data);
  }
};

module.exports = { initCampaignSocket, emitCampaignProgress, emitEmailStatus };

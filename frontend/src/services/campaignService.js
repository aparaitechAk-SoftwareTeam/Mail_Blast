import api from './api';

export const fetchCampaigns = async (params) => {
  const res = await api.get('/campaigns', { params });
  return res.data;
};

export const fetchCampaignById = async (id) => {
  const res = await api.get(`/campaigns/${id}`);
  return res.data;
};

export const createCampaign = async (data) => {
  const res = await api.post('/campaigns', data);
  return res.data;
};

export const launchCampaign = async (id) => {
  const res = await api.post(`/campaigns/${id}/launch`);
  return res.data;
};

export const retryFailedEmails = async (id) => {
  const res = await api.post(`/campaigns/${id}/retry`);
  return res.data;
};

export const sendTestEmail = async (data) => {
  const res = await api.post('/campaigns/send-test', data);
  return res.data;
};

export const fetchDeliveryStatus = async (targetId) => {
  const res = await api.get(`/settings/smtp/delivery-status/${encodeURIComponent(targetId)}`);
  return res.data;
};

export const fetchSmtpGateways = async () => {
  const res = await api.get('/settings/smtp/gateways');
  return res.data;
};

export const createSmtpGateway = async (data) => {
  const res = await api.post('/settings/smtp/gateways', data);
  return res.data;
};

export const updateSmtpGateway = async (id, data) => {
  const res = await api.put(`/settings/smtp/gateways/${id}`, data);
  return res.data;
};

export const deleteSmtpGateway = async (id) => {
  const res = await api.delete(`/settings/smtp/gateways/${id}`);
  return res.data;
};

export const testSmtpGatewayConnection = async (id) => {
  const res = await api.post(`/settings/smtp/gateways/${id}/test`);
  return res.data;
};


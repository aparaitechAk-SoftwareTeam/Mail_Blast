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

export const generateDuplicateTitle = (title, existingCampaigns = []) => {
  if (!title || typeof title !== 'string') return 'Untitled Campaign - Copy';

  const existingTitles = existingCampaigns.map(c => (typeof c === 'string' ? c : c?.title || ''));

  let baseTitle = title;
  const copySuffixRegex = / - Copy(?: (\d+))?$/;
  const match = title.match(copySuffixRegex);
  if (match) {
    baseTitle = title.replace(copySuffixRegex, '');
  }

  let candidate = '';
  if (match) {
    const currentNum = match[1] ? parseInt(match[1], 10) : 1;
    candidate = `${baseTitle} - Copy ${currentNum + 1}`;
  } else {
    candidate = `${baseTitle} - Copy`;
  }

  let counter = match && match[1] ? parseInt(match[1], 10) + 1 : 1;
  while (existingTitles.includes(candidate)) {
    counter++;
    candidate = `${baseTitle} - Copy ${counter}`;
  }

  return candidate;
};



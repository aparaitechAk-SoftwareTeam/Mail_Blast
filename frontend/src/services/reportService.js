import api from './api';

export const fetchDashboardStats = async () => {
  const res = await api.get('/reports/dashboard');
  return res.data;
};

export const fetchDetailedReports = async () => {
  const res = await api.get('/reports/detailed');
  return res.data;
};

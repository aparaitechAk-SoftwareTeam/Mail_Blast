import api from './api';

export const fetchUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};

export const createUser = async (data) => {
  const res = await api.post('/users', data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};

export const fetchSuppressions = async () => {
  const res = await api.get('/suppressions');
  return res.data;
};

export const addSuppression = async (data) => {
  const res = await api.post('/suppressions', data);
  return res.data;
};

export const removeSuppression = async (id) => {
  const res = await api.delete(`/suppressions/${id}`);
  return res.data;
};

export const fetchAuditLogs = async () => {
  const res = await api.get('/audit-logs');
  return res.data;
};

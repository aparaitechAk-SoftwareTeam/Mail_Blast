import api from './api';

export const fetchTemplates = async () => {
  const res = await api.get('/templates');
  return res.data;
};

export const createTemplate = async (data) => {
  const res = await api.post('/templates', data);
  return res.data;
};

export const updateTemplate = async (id, data) => {
  const res = await api.put(`/templates/${id}`, data);
  return res.data;
};

export const deleteTemplate = async (id) => {
  const res = await api.delete(`/templates/${id}`);
  return res.data;
};

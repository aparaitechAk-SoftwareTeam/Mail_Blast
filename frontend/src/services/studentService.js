import api from './api';

export const fetchStudents = async (params) => {
  const res = await api.get('/students', { params });
  return res.data;
};

export const createStudent = async (data) => {
  const res = await api.post('/students', data);
  return res.data;
};

export const updateStudent = async (id, data) => {
  const res = await api.put(`/students/${id}`, data);
  return res.data;
};

export const deleteStudent = async (id) => {
  const res = await api.delete(`/students/${id}`);
  return res.data;
};

export const bulkDeleteStudents = async (ids) => {
  const res = await api.delete('/students/bulk-delete', { data: { ids } });
  return res.data;
};

export const previewUpload = async (formData) => {
  const res = await api.post('/upload/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const confirmImport = async (validStudents) => {
  const res = await api.post('/upload/confirm', { validStudents });
  return res.data;
};

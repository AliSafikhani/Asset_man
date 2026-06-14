import axios from 'axios';

const API = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me')
};

// Asset APIs
export const assetAPI = {
  getAll: () => API.get('/assets/'),
  getById: (id) => API.get(`/assets/${id}`),
  create: (data) => API.post('/assets/', data),
  update: (id, data) => API.put(`/assets/${id}`, data),
  delete: (id) => API.delete(`/assets/${id}`)
};

// DCS Mapping APIs
export const dcsAPI = {
  getTables: (siteId) => API.get(`/dcs/tables/${siteId}`),
  getColumns: (tableName) => API.get(`/dcs/columns/${tableName}`),
  getMappings: (assetId) => API.get(`/dcs/asset/${assetId}`),
  createMapping: (data) => API.post('/dcs/', data),
  deleteMapping: (id) => API.delete(`/dcs/${id}`)
};

// Alarm APIs
export const alarmAPI = {
  getBySignal: (signalId) => API.get(`/alarms/signal/${signalId}`),
  create: (data) => API.post('/alarms/', data),
  delete: (id) => API.delete(`/alarms/${id}`)
};

// Event APIs
export const eventAPI = {
  getByAsset: (assetId) => API.get(`/events/asset/${assetId}`),
  getById: (id) => API.get(`/events/${id}`),
  create: (data) => API.post('/events/', data),
  update: (id, data) => API.put(`/events/${id}`, data),
  delete: (id) => API.delete(`/events/${id}`),
  uploadAttachment: (eventId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post(`/events/${eventId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default API;

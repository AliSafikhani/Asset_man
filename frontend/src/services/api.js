import axios from 'axios';

// Use /api/v1 for all endpoints except algorithms
const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1',  // Back to /api/v1
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

// Test APIs
export const testAPI = {
  getTestTypes: (assetType) => API.get(`/test-types/?asset_type=${assetType}`),
  getTestFields: (testTypeId) => API.get(`/test-fields/test-type/${testTypeId}`),
  getTestResults: (assetId, testTypeId) => API.get(`/test-results/asset/${assetId}?test_type_id=${testTypeId}`),
  createTestResult: (data) => API.post('/test-results/', data),
  updateTestResult: (id, data) => API.put(`/test-results/${id}`, data),
  deleteTestResult: (id) => API.delete(`/test-results/${id}`),
  batchDeleteTestResults: (ids) => API.delete('/test-results/batch', { data: ids })
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

export const algorithmAPI = {
  // Get algorithms for a specific asset and test type
  getAlgorithms: (assetType, testType) => 
    API.get(`/algorithms/${assetType}/${testType}`),
  
  // Calculate a specific algorithm for a single sample
  calculateAlgorithm: (assetType, testType, algorithmId, parameters) => 
    API.post(`/algorithms/${assetType}/${testType}/${algorithmId}`, parameters),
  
  // Calculate a specific algorithm for multiple samples (batch)
  calculateAlgorithmBatch: (assetType, testType, algorithmId, samples) => 
    API.post(`/algorithms/${assetType}/${testType}/${algorithmId}/batch`, samples),
  
  // Duval Triangle 1 - specific helper
  calculateDuvalTriangle1: (samples) => 
    API.post('/algorithms/transformer/dga/duval_triangle_1/batch', samples),
  
  // Get all algorithms info
  getAlgorithmsInfo: () => API.get('/algorithms/info'),
  
  // Health check
  getAlgorithmsHealth: () => API.get('/algorithms/health'),
};

// Export the default API instance
export default API;
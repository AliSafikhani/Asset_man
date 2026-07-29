/**
 * Monitoring API Client
 * File: frontend/src/api/monitoring.js
 * Description: API client for live monitoring module
 */

import apiClient from './client';

// ============================================================
// SIGNAL GROUPS
// ============================================================

export const getPlantGroups = async (plantId) => {
  const response = await apiClient.get(`/monitoring/plants/${plantId}/groups`);
  return response.data;
};

export const createGroup = async (data) => {
  const response = await apiClient.post('/monitoring/groups', data);
  return response.data;
};

export const updateGroup = async (groupId, data) => {
  const response = await apiClient.put(`/monitoring/groups/${groupId}`, data);
  return response.data;
};

export const deleteGroup = async (groupId) => {
  await apiClient.delete(`/monitoring/groups/${groupId}`);
};

// ============================================================
// SIGNAL CONFIGURATION
// ============================================================

export const getPlantSignals = async (plantId, includeUnassigned = true) => {
  const response = await apiClient.get(
    `/monitoring/plants/${plantId}/signals`,
    { params: { include_unassigned: includeUnassigned } }
  );
  return response.data;
};

export const getAssetSignals = async (assetId) => {
  const response = await apiClient.get(`/monitoring/assets/${assetId}/signals`);
  return response.data;
};

export const getSignalConfig = async (signalId, plantId = null) => {
  const params = plantId ? { plant_id: plantId } : {};
  const response = await apiClient.get(`/monitoring/signals/${signalId}/config`, { params });
  return response.data;
};

export const updateSignalConfig = async (signalId, data, plantId = null) => {
  const params = plantId ? { plant_id: plantId } : {};
  const response = await apiClient.put(`/monitoring/signals/${signalId}/config`, data, { params });
  return response.data;
};

// ============================================================
// SIGNAL DATA
// ============================================================

export const getSignalData = async (signalId, timeLevel = 'raw', params = {}) => {
  const response = await apiClient.get(
    `/monitoring/signals/${signalId}/data`,
    {
      params: {
        time_level: timeLevel,
        ...params
      }
    }
  );
  return response.data;
};

export const getSignalTimeline = async (signalId, timeLevel = 'raw', params = {}) => {
  const response = await apiClient.get(
    `/monitoring/signals/${signalId}/timeline`,
    {
      params: {
        time_level: timeLevel,
        ...params
      }
    }
  );
  return response.data;
};

export const getSignalLatest = async (signalId) => {
  const response = await apiClient.get(`/monitoring/signals/${signalId}/latest`);
  return response.data;
};

// ============================================================
// SIGNAL DATA RANGE  ← ADD THIS SECTION
// ============================================================

export const getSignalDataRange = async (signalId) => {
  const response = await apiClient.get(`/monitoring/signals/${signalId}/range`);
  return response.data;
};

// ============================================================
// SIGNAL ASSIGNMENT
// ============================================================

export const assignSignalToAsset = async (signalId, assetId, plantId, groupId = null) => {
  const params = new URLSearchParams();
  params.append('asset_id', assetId);
  params.append('plant_id', plantId);
  if (groupId) params.append('group_id', groupId);
  
  const response = await apiClient.post(
    `/monitoring/signals/${signalId}/assign?${params.toString()}`
  );
  return response.data;
};

export const unassignSignal = async (signalId, plantId) => {
  await apiClient.delete(`/monitoring/signals/${signalId}/assign?plant_id=${plantId}`);
};

// ============================================================
// COMPARISON GROUPS
// ============================================================

export const getComparisonGroups = async (plantId) => {
  const response = await apiClient.get(`/monitoring/plants/${plantId}/comparison-groups`);
  return response.data;
};

export const createComparisonGroup = async (data) => {
  const response = await apiClient.post('/monitoring/comparison-groups', data);
  return response.data;
};

export const deleteComparisonGroup = async (groupId) => {
  await apiClient.delete(`/monitoring/comparison-groups/${groupId}`);
};

export const addToComparisonGroup = async (groupId, signalConfigId) => {
  const response = await apiClient.post(
    `/monitoring/comparison-groups/${groupId}/items`,
    { signal_config_id: signalConfigId }
  );
  return response.data;
};

export const removeFromComparisonGroup = async (groupId, itemId) => {
  await apiClient.delete(`/monitoring/comparison-groups/${groupId}/items/${itemId}`);
};

export const getComparisonData = async (plantId, groupId, timeLevel = 'raw', params = {}) => {
  const response = await apiClient.get(
    `/monitoring/plants/${plantId}/compare`,
    {
      params: {
        group_id: groupId,
        time_level: timeLevel,
        ...params
      }
    }
  );
  return response.data;
};

// ============================================================
// ALARMS
// ============================================================

export const getActiveAlarms = async (assetId = null, plantId = null) => {
  const params = {};
  if (assetId) params.asset_id = assetId;
  if (plantId) params.plant_id = plantId;
  
  const response = await apiClient.get('/monitoring/alarms/active', { params });
  return response.data;
};

export const acknowledgeAlarm = async (alarmId) => {
  const response = await apiClient.post(`/monitoring/alarms/${alarmId}/acknowledge`);
  return response.data;
};

export const clearAlarm = async (alarmId) => {
  const response = await apiClient.post(`/monitoring/alarms/${alarmId}/clear`);
  return response.data;
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export const getTimeLevelLabel = (timeLevel) => {
  const labels = {
    raw: 'Raw (1Hz)',
    minute: '1-Minute',
    hour: '1-Hour'
  };
  return labels[timeLevel] || timeLevel;
};

export const getTimeLevelDays = (timeLevel) => {
  const days = {
    raw: 30,
    minute: 730,  // 2 years
    hour: 10950   // 30 years
  };
  return days[timeLevel] || 0;
};
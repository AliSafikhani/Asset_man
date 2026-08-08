/**
 * RUL (Thermal Life, IEC 60076-7) API client
 * File: frontend/src/api/rul.js
 *
 * Wraps the diagnostics RUL routes (mounted at /api/v1/diagnostics):
 *   GET  /transformer/{assetId}/rul                  → run the assessment
 *   GET  /transformer/{assetId}/rul/config           → saved signal mapping
 *   PUT  /transformer/{assetId}/rul/config           → upsert signal mapping
 *   GET  /transformer/{assetId}/rul/available-signals→ plant DCS signals
 */

import apiClient from './client';

// Run the live IEC 60076-7 thermal-life assessment.
export const getRUL = async (assetId) => {
  const { data } = await apiClient.get(`/diagnostics/transformer/${assetId}/rul`);
  return data;
};

// Read the saved role→signal mapping (top oil / ambient / current).
export const getRULConfig = async (assetId) => {
  const { data } = await apiClient.get(`/diagnostics/transformer/${assetId}/rul/config`);
  return data;
};

// Upsert the role→signal mapping.
// payload: { top_oil_signal_id, ambient_signal_id, current_signal_id }
export const saveRULConfig = async (assetId, payload) => {
  const { data } = await apiClient.put(
    `/diagnostics/transformer/${assetId}/rul/config`,
    payload
  );
  return data;
};

// List all DCS signals for the asset's plant (for the mapping dropdowns).
export const getRULAvailableSignals = async (assetId) => {
  const { data } = await apiClient.get(
    `/diagnostics/transformer/${assetId}/rul/available-signals`
  );
  return data;
};

export default { getRUL, getRULConfig, saveRULConfig, getRULAvailableSignals };

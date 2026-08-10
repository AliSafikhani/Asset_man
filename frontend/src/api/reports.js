/**
 * Transformer Asset Report API client
 * File: frontend/src/api/reports.js
 *
 * Wraps the report aggregator route (mounted at /api/v1/reports):
 *   GET /transformer/{assetId}?modules=dga,iec62874,rul
 *
 * Returns one JSON envelope the report pages render directly:
 *   { asset_id, status, modules, data: { cover, dga?, iec62874?, rul? } }
 */

import apiClient from './client';

// Fetch the full report payload for a transformer.
// modules: array of module keys to include, e.g. ['dga', 'iec62874', 'rul'].
export const getTransformerReport = async (assetId, modules = []) => {
  const qs = modules.length ? `?modules=${modules.join(',')}` : '';
  const { data } = await apiClient.get(`/reports/transformer/${assetId}${qs}`);
  return data;
};

export default { getTransformerReport };

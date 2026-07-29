/**
 * Monitoring Data Hook
 * File: frontend/src/hooks/useMonitoringData.js
 * Description: Custom hook for fetching and managing monitoring data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPlantSignals,
  getAssetSignals,
  getSignalData,
  getSignalTimeline,
  getSignalLatest,
  updateSignalConfig,
  assignSignalToAsset,
  unassignSignal,
} from '../api/monitoring';

/**
 * Hook for fetching signals for a plant or asset
 */
export const useSignals = (plantId, assetId = null, includeUnassigned = true) => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSignals = useCallback(async () => {
    if (!plantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let data;
      if (assetId) {
        data = await getAssetSignals(assetId);
        // Transform asset signals to match plant signals structure
        data = data.map(s => ({
          signal_id: s.signal_id,
          plant_id: s.plant_id,
          kks_code: s.signal_details?.kks_code || '',
          name: s.signal_details?.name || s.custom_name || `Signal_${s.signal_id}`,
          description: s.signal_details?.description || '',
          unit: s.custom_unit || s.signal_details?.unit || '',
          config_id: s.id,
          asset_id: s.asset_id,
          group_id: s.group_id,
          custom_name: s.custom_name,
          custom_unit: s.custom_unit,
          color_hex: s.color_hex,
          is_visible: s.is_visible,
          is_assigned: true,
        }));
        setSignals(data);
      } else {
        const response = await getPlantSignals(plantId, includeUnassigned);
        setSignals(response.signals || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, [plantId, assetId, includeUnassigned]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  return { signals, loading, error, refetch: fetchSignals };
};

/**
 * Hook for fetching signal data (time-series)
 */
export const useSignalData = (signalId, timeLevel = 'raw', params = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);

  const fetchData = useCallback(async () => {
    if (!signalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getSignalData(signalId, timeLevel, params);
      setData(response.data_points || []);
      setTotalPoints(response.total_points || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch signal data');
    } finally {
      setLoading(false);
    }
  }, [signalId, timeLevel, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, totalPoints, refetch: fetchData };
};

/**
 * Hook for fetching signal timeline (data availability)
 */
/**
 * Hook for fetching signal timeline (data availability)
 */
export const useSignalTimeline = (signalId, timeLevel = 'raw', params = {}) => {
  const [intervals, setIntervals] = useState([]);
  const [loading, setLoading] = useState(false); // ← start as false
  const [error, setError] = useState(null);
  const [totalIntervals, setTotalIntervals] = useState(0);

  const fetchTimeline = useCallback(async () => {
    if (!signalId) {
      setIntervals([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getSignalTimeline(signalId, timeLevel, params);
      setIntervals(response.intervals || []);
      setTotalIntervals(response.total_intervals || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch timeline');
      setIntervals([]);
    } finally {
      setLoading(false);
    }
  }, [signalId, timeLevel, JSON.stringify(params)]); // ← use JSON.stringify to prevent infinite loop

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return { intervals, loading, error, totalIntervals, refetch: fetchTimeline };
};

/**
 * Hook for fetching latest values for signals
 */
export const useLatestValues = (signalIds = []) => {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatest = useCallback(async () => {
    if (!signalIds || signalIds.length === 0) {
      setValues({});
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch latest values for each signal
      const results = {};
      for (const id of signalIds) {
        try {
          const data = await getSignalLatest(id);
          results[id] = data;
        } catch (err) {
          // Individual signal failures don't break the whole batch
          console.warn(`Failed to fetch latest for signal ${id}:`, err);
        }
      }
      setValues(results);
    } catch (err) {
      setError(err.message || 'Failed to fetch latest values');
    } finally {
      setLoading(false);
    }
  }, [signalIds]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  return { values, loading, error, refetch: fetchLatest };
};

/**
 * Hook for updating signal configuration
 */
export const useUpdateSignalConfig = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateConfig = useCallback(async (signalId, data, plantId = null) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await updateSignalConfig(signalId, data, plantId);
      setSuccess(true);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to update signal configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateConfig, loading, error, success };
};

/**
 * Hook for assigning a signal to an asset
 */
export const useAssignSignal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const assignSignal = useCallback(async (signalId, assetId, plantId, groupId = null) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await assignSignalToAsset(signalId, assetId, plantId, groupId);
      setSuccess(true);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to assign signal to asset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { assignSignal, loading, error, success };
};

/**
 * Hook for unassigning a signal
 */
export const useUnassignSignal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const unassignSignalFn = useCallback(async (signalId, plantId) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await unassignSignal(signalId, plantId);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to unassign signal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { unassignSignal: unassignSignalFn, loading, error, success };
};

/**
 * Hook for managing selection state of signals
 */
/**
 * Hook for managing selection state of signals
 */
export const useSignalSelection = (signals = []) => {
  const [selectedSignals, setSelectedSignals] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const prevSignalsRef = useRef([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!signals || signals.length === 0) {
      if (initializedRef.current) return;
      setSelectedSignals([]);
      setSelectedIds(new Set());
      initializedRef.current = true;
      return;
    }

    // Compare signal IDs to avoid infinite loop
    const prevIds = prevSignalsRef.current.map(s => s.signal_id);
    const currentIds = signals.map(s => s.signal_id);
    
    if (prevIds.length === currentIds.length && 
        prevIds.every((id, i) => id === currentIds[i])) {
      return; // No change
    }
    
    prevSignalsRef.current = signals;

    const visible = signals
      .filter(s => s.is_visible !== false)
      .map(s => s.signal_id);
      
    setSelectedSignals(visible);
    setSelectedIds(new Set(visible));
    initializedRef.current = true;
  }, [signals]);

  const toggleSignal = useCallback((signalId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(signalId)) {
        newSet.delete(signalId);
      } else {
        newSet.add(signalId);
      }
      setSelectedSignals(Array.from(newSet));
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = signals.map(s => s.signal_id);
    setSelectedIds(new Set(allIds));
    setSelectedSignals(allIds);
  }, [signals]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedSignals([]);
  }, []);

  const isSelected = useCallback((signalId) => {
    return selectedIds.has(signalId);
  }, [selectedIds]);

  return {
    selectedSignals,
    selectedIds,
    toggleSignal,
    selectAll,
    deselectAll,
    isSelected,
    count: selectedSignals.length,
  };
};
/**
 * Hook for managing time range state
 */
export const useTimeRange = (initialHours = 24) => {
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [hours, setHours] = useState(initialHours);

  useEffect(() => {
    const now = new Date();
    setEndTime(now);
    setStartTime(new Date(now.getTime() - hours * 60 * 60 * 1000));
  }, [hours]);

  const setRange = useCallback((start, end) => {
    setStartTime(start);
    setEndTime(end);
    if (start && end) {
      const diffHours = (end - start) / (1000 * 60 * 60);
      setHours(Math.round(diffHours));
    }
  }, []);

  // ✅ ADD THIS FUNCTION
  const setRangeFromDates = useCallback((startDate, endDate) => {
    setStartTime(startDate);
    setEndTime(endDate);
    if (startDate && endDate) {
      const diffHours = (endDate - startDate) / (1000 * 60 * 60);
      setHours(Math.round(diffHours));
    }
  }, []);

  return {
    startTime,
    endTime,
    hours,
    setHours,
    setRange,
    setRangeFromDates,  // ✅ EXPORT IT
    format: {
      start: startTime ? startTime.toISOString() : null,
      end: endTime ? endTime.toISOString() : null,
    },
  };
};

export default {
  useSignals,
  useSignalData,
  useSignalTimeline,
  useLatestValues,
  useUpdateSignalConfig,
  useAssignSignal,
  useUnassignSignal,
  useSignalSelection,
  useTimeRange,
};
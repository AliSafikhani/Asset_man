/**
 * Live Monitoring Component – Fixed Width & Controls
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/index.jsx
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

import SignalTable from './SignalTable';
import TrendChart from './TrendChart';
import RealTimeValues from './RealTimeValues';
import SignalSettings from './SignalSettings';

import {
  useSignals,
  useLatestValues,
  useSignalSelection,
  useUpdateSignalConfig,
} from '../../../../../../hooks/useMonitoringData';

import { getSignalData } from '../../../../../../api/monitoring';

// ============================================================
// FIXED TIME CONFIGURATION
// ============================================================
const TIME_LEVELS = [
  { id: 'raw', label: 'Real-time', description: '1s (4 Hour Window)', windowHours: 120, retentionDays: 30 },
  { id: 'minute', label: 'Minute', description: '1m avg (7 Day Window)', windowHours: 120, retentionDays: 365 },
  { id: 'hour', label: 'Hour', description: '1h avg (30 Day Window)', windowHours: 720, retentionDays: 10950 },
];

const getDefaultEndTime = () => new Date();

const formatDateTimeLocal = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const LiveMonitoring = ({ asset, assetId, plantId: propPlantId }) => {
  const theme = useTheme();
  const plantId = propPlantId || asset?.plant_id;
  const MAX_POINTS = 35000;

  // ============================================================
  // State
  // ============================================================
  const [timeLevel, setTimeLevel] = useState('raw');
  const [endTimes, setEndTimes] = useState({
    raw: getDefaultEndTime(),
    minute: getDefaultEndTime(),
    hour: getDefaultEndTime(),
  });

  const [selectedSignalId, setSelectedSignalId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chartData, setChartData] = useState({});
  const [chartLoading, setChartLoading] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const initialLoadDone = useRef(false);

  const currentLevelConfig = useMemo(
    () => TIME_LEVELS.find((t) => t.id === timeLevel) || TIME_LEVELS[0],
    [timeLevel]
  );

  const currentEndTime = endTimes[timeLevel] || getDefaultEndTime();

  const calculatedStartTime = useMemo(() => {
    return new Date(currentEndTime.getTime() - currentLevelConfig.windowHours * 60 * 60 * 1000);
  }, [currentEndTime, currentLevelConfig]);

  // Hooks
  const { signals, loading: signalsLoading, error: signalsError, refetch: refetchSignals } = useSignals(plantId, assetId, false);
  const { selectedIds, toggleSignal, selectAll, deselectAll, isSelected, count: selectedCount } = useSignalSelection(signals);

  useEffect(() => {
    if (signals.length > 0 && selectedIds.size === 0 && !initialLoadDone.current) {
      selectAll();
      initialLoadDone.current = true;
    }
  }, [signals, selectAll, selectedIds]);

  const selectedSignalIds = useMemo(
    () => signals.filter((s) => isSelected(s.signal_id)).map((s) => s.signal_id),
    [signals, isSelected]
  );

  // ============================================================
  // Data Fetcher
  // ============================================================
  const fetchChartData = useCallback(async () => {
    if (selectedSignalIds.length === 0) {
      setChartData({});
      setChartLoading(false);
      return;
    }

    setChartLoading(true);
    const startStr = calculatedStartTime.toISOString();
    const endStr = currentEndTime.toISOString();

    try {
      const dataMap = {};
      for (const signalId of selectedSignalIds) {
        const response = await getSignalData(signalId, timeLevel, {
          start_time: startStr,
          end_time: endStr,
          max_points: MAX_POINTS,
        });
        dataMap[signalId] = response.data_points || [];
      }
      setChartData(dataMap);
    } catch (error) {
      console.error('❌ Failed to fetch chart data:', error);
    } finally {
      setChartLoading(false);
    }
  }, [selectedSignalIds, timeLevel, calculatedStartTime, currentEndTime]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData, forceRefresh]);

  // Latest Values & Config Handlers
  const { values: latestValues, loading: latestLoading, refetch: refetchLatest } = useLatestValues(selectedSignalIds);
  const { updateConfig, loading: updateLoading } = useUpdateSignalConfig();

  const handleTimeLevelChange = useCallback((event, newValue) => {
    setTimeLevel(newValue);
    setChartData({});
  }, []);

  const handleEndTimeChange = (newEnd) => {
    if (isNaN(newEnd.getTime())) return;
    setEndTimes((prev) => ({
      ...prev,
      [timeLevel]: newEnd,
    }));
  };

  const handleApply = () => setForceRefresh((prev) => prev + 1);

  const handleRefresh = useCallback(() => {
    refetchLatest();
    refetchSignals();
    setForceRefresh((prev) => prev + 1);
  }, [refetchLatest, refetchSignals]);

  const handleSignalSelect = useCallback((signalId) => {
    setSelectedSignalId(signalId);
    setShowSettings(true);
  }, []);

  const handleSignalConfigUpdate = useCallback(async (signalId, config) => {
    try {
      await updateConfig(signalId, config, plantId);
      await refetchSignals();
    } catch (error) {
      console.error('Failed to update signal config:', error);
    }
  }, [updateConfig, plantId, refetchSignals]);

  const closeSettings = () => setShowSettings(false);

  const totalDataPoints = useMemo(
    () => Object.values(chartData).reduce((sum, data) => sum + (data?.length || 0), 0),
    [chartData]
  );
  const hasChartData = selectedSignalIds.length > 0 && totalDataPoints > 0;
  const selectedSignalData = useMemo(() => signals.filter((s) => isSelected(s.signal_id)), [signals, isSelected]);

  if (signalsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400} width="100%">
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>Loading signals...</Typography>
      </Box>
    );
  }

  if (signalsError) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Alert severity="error" action={<Button size="small" onClick={refetchSignals}>Retry</Button>}>{signalsError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      {/* HEADER BANNER */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          padding: { xs: '16px 20px', sm: '20px 28px' },
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          width: '100%',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>Live Monitoring</Typography>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mt={0.5}>
            <Chip label={`${selectedCount} of ${signals.length} signals`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
            {!chartLoading && (
              <Chip label={`${totalDataPoints} points`} size="small" sx={{ bgcolor: hasChartData ? 'rgba(76,175,80,0.3)' : 'rgba(255,193,7,0.3)', color: 'white' }} />
            )}
          </Box>
        </Box>
        <IconButton size="small" onClick={handleRefresh} disabled={latestLoading} sx={{ color: 'white' }}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* TABS HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Paper elevation={0} sx={{ p: 0.5, borderRadius: 2, bgcolor: '#f1f5f9', display: 'inline-flex' }}>
          <Tabs
            value={timeLevel}
            onChange={handleTimeLevelChange}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { textTransform: 'none', px: 2.5, color: '#64748b', '&.Mui-selected': { color: '#0f172a', bgcolor: 'white', fontWeight: 600 } },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            {TIME_LEVELS.map((level) => (
              <Tab
                key={level.id}
                value={level.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">{level.label}</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>{level.description}</Typography>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Paper>
      </Box>

      {/* CONTROLS BAR */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2, width: '100%' }} elevation={0} variant="outlined">
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            label="End Time"
            type="datetime-local"
            value={formatDateTimeLocal(currentEndTime)}
            onChange={(e) => handleEndTimeChange(new Date(e.target.value))}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><CalendarIcon fontSize="small" /></InputAdornment>,
            }}
            sx={{ minWidth: 230 }}
          />
          <Button variant="contained" size="medium" onClick={handleApply} sx={{ textTransform: 'none' }}>
            Apply
          </Button>
          <Typography variant="body2" color="text.secondary">
            <strong>Range:</strong> {calculatedStartTime.toLocaleString()} <strong>→</strong> {currentEndTime.toLocaleString()}
          </Typography>
        </Box>
      </Paper>

      {/* REAL TIME SUMMARY VALUES */}
      <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1.5, mb: 2.5, border: '1px solid #e2e8f0', width: '100%' }}>
        <RealTimeValues
          signals={signals}
          selectedSignalIds={selectedSignalIds}
          latestValues={latestValues}
          loading={latestLoading}
          onSignalClick={handleSignalSelect}
          maxDisplay={6}
          compact
        />
      </Box>

      {/* MAIN CONTENT AREA: GRID SPLIT 2 vs 10 RESTORED */}
      <Grid container spacing={2.5} sx={{ width: '100%' }}>
        <Grid item xs={12} md={2} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1.5, border: '1px solid #e2e8f0', height: '100%', maxHeight: 520, overflow: 'auto', width: '100%' }}>
            <SignalTable
              signals={signals}
              selectedIds={selectedIds}
              onToggle={toggleSignal}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              latestValues={latestValues}
              onUpdateConfig={handleSignalConfigUpdate}
              timeLevel={timeLevel}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={10} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1.5, border: '1px solid #e2e8f0', height: '100%', minHeight: 420, width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            {chartLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={420}>
                <CircularProgress size={32} />
                <Typography variant="body2" sx={{ ml: 2 }}>Loading chart data...</Typography>
              </Box>
            ) : hasChartData ? (
              <TrendChart
                key={timeLevel}
                signals={selectedSignalData}
                signalData={chartData}
                timeLevel={timeLevel}
                startTime={calculatedStartTime}
                endTime={currentEndTime}
                latestValues={latestValues}
                height={420}
                isLoading={chartLoading}
                onSignalClick={handleSignalSelect}
                maxPoints={MAX_POINTS}
              />
            ) : (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={420} bgcolor="#fafafa" borderRadius={2}>
                <Typography variant="body1" color="text.secondary">No data points found for this range.</Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* DRAWER SETTINGS */}
      <Drawer anchor="right" open={showSettings && !!selectedSignalId} onClose={closeSettings}>
        <Box sx={{ width: { xs: '100%', sm: 420 }, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Signal Settings</Typography>
            <IconButton onClick={closeSettings}><CloseIcon /></IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {selectedSignalId && (
            <SignalSettings
              signal={signals.find((s) => s.signal_id === selectedSignalId)}
              onUpdate={handleSignalConfigUpdate}
              loading={updateLoading}
            />
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default LiveMonitoring;
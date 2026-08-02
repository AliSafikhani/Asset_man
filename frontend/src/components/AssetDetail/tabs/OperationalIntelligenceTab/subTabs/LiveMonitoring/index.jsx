/**
 * Live Monitoring Component – With plantId Check & Timeout Fallback
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/index.jsx
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box,
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
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon,
  ShowChart as ShowChartIcon,
  Sensors as SensorsIcon,
} from '@mui/icons-material';

import SignalTable from './SignalTable';
import TrendChart from './TrendChart';
import RealTimeValues from './RealTimeValues';
import SignalSettings from './SignalSettings';

import {
  useSignals,
  useSignalSelection,
  useUpdateSignalConfig,
} from '../../../../../../hooks/useMonitoringData';

import { getSignalData } from '../../../../../../api/monitoring';

// ============================================================
// TIME LEVEL CONFIGURATION
// ============================================================
const TIME_LEVELS = [
  {
    id: 'raw',
    label: 'Real-time',
    description: '1s Resolution',
    defaultWindow: 4,
    windowOptions: [
      { label: '1 Hour Window', hours: 1 },
      { label: '2 Hours Window', hours: 2 },
      { label: '4 Hours Window', hours: 4 },
      { label: '8 Hours Window', hours: 8 },
      { label: '12 Hours Window', hours: 12 },
      { label: '24 Hours Window', hours: 24 },
    ],
  },
  {
    id: 'minute',
    label: 'Minute',
    description: '1m Aggregation',
    defaultWindow: 168,
    windowOptions: [
      { label: '1 Day Window', hours: 24 },
      { label: '3 Days Window', hours: 72 },
      { label: '7 Days Window', hours: 168 },
      { label: '14 Days Window', hours: 336 },
      { label: '30 Days Window', hours: 720 },
    ],
  },
  {
    id: 'hour',
    label: 'Hour',
    description: '1h Aggregation',
    defaultWindow: 720,
    windowOptions: [
      { label: '7 Days Window', hours: 168 },
      { label: '14 Days Window', hours: 336 },
      { label: '30 Days (1 Mo)', hours: 720 },
      { label: '90 Days (3 Mo)', hours: 2160 },
      { label: '180 Days (6 Mo)', hours: 4320 },
      { label: '1 Year Window', hours: 8760 },
    ],
  },
];

const getDefaultEndTime = () => new Date();

const formatDateTimeLocal = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const LiveMonitoring = ({ asset, assetId, plantId: propPlantId }) => {
  const plantId = propPlantId || asset?.plant_id;
  const MAX_POINTS = 15000;

  // ============================================================
  // 🔥 Check if plantId is valid
  // ============================================================
  if (!plantId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
        <Alert severity="warning" variant="filled" sx={{ borderRadius: 2 }}>
          No plant ID available. Please select an asset with a valid plant.
        </Alert>
      </Box>
    );
  }

  // State
  const [timeLevel, setTimeLevel] = useState('raw');
  const [tabSettings, setTabSettings] = useState({
    raw: { windowHours: 4, endTime: getDefaultEndTime() },
    minute: { windowHours: 168, endTime: getDefaultEndTime() },
    hour: { windowHours: 720, endTime: getDefaultEndTime() },
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

  const currentWindowHours = tabSettings[timeLevel]?.windowHours || currentLevelConfig.defaultWindow;
  const currentEndTime = tabSettings[timeLevel]?.endTime || getDefaultEndTime();

  const calculatedStartTime = useMemo(() => {
    return new Date(currentEndTime.getTime() - currentWindowHours * 60 * 60 * 1000);
  }, [currentEndTime, currentWindowHours]);

  // Data Hooks
  const { signals, loading: signalsLoading, error: signalsError, refetch: refetchSignals } = useSignals(plantId, assetId, false);
  const { selectedIds, toggleSignal, selectAll, deselectAll, isSelected, count: selectedCount } = useSignalSelection(signals);

  // ============================================================
  // 🔥 Timeout fallback for loading
  // ============================================================
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (signalsLoading) {
        setLoadingTimeout(true);
        console.warn('⚠️ Signals loading timed out after 15 seconds');
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [signalsLoading]);

  // Reset timeout when signals load
  useEffect(() => {
    if (!signalsLoading) {
      setLoadingTimeout(false);
    }
  }, [signalsLoading]);

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

  // Handlers
  const handleWindowChange = (newWindowHours) => {
    setTabSettings((prev) => ({
      ...prev,
      [timeLevel]: { ...prev[timeLevel], windowHours: newWindowHours },
    }));
  };

  const handleEndTimeChange = (newEnd) => {
    if (isNaN(newEnd.getTime())) return;
    setTabSettings((prev) => ({
      ...prev,
      [timeLevel]: { ...prev[timeLevel], endTime: newEnd },
    }));
  };

  // Fetch Telemetry Data
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

  // ============================================================
  // Derive latest values from chartData
  // ============================================================
  const latestValuesFromChart = useMemo(() => {
    const result = {};
    for (const [signalId, points] of Object.entries(chartData)) {
      if (points && points.length > 0) {
        const last = points[points.length - 1];
        result[signalId] = {
          value: last.avg_value !== undefined ? last.avg_value : last.value,
          timestamp: last.timestamp,
          quality: last.quality !== undefined ? last.quality : true,
        };
      }
    }
    return result;
  }, [chartData]);

  const { updateConfig, loading: updateLoading } = useUpdateSignalConfig();

  const handleTimeLevelChange = useCallback((event, newValue) => {
    setTimeLevel(newValue);
    setChartData({});
  }, []);

  const handleApply = () => setForceRefresh((prev) => prev + 1);

  const handleRefresh = useCallback(() => {
    refetchSignals();
    setForceRefresh((prev) => prev + 1);
  }, [refetchSignals]);

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

  // ============================================================
  // Render with loading and timeout handling
  // ============================================================
  if (signalsLoading && !loadingTimeout) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={500} width="100%">
        <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
        <Typography variant="body2" sx={{ ml: 2, color: '#64748b', fontWeight: 500 }}>
          Initializing signal feeds...
        </Typography>
      </Box>
    );
  }

  if (loadingTimeout) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Alert
          severity="error"
          variant="filled"
          action={
            <Button color="inherit" size="small" onClick={() => { setLoadingTimeout(false); refetchSignals(); }}>
              Retry
            </Button>
          }
        >
          Failed to load signals after 15 seconds. Check backend connectivity and network.
        </Alert>
      </Box>
    );
  }

  if (signalsError) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Alert severity="error" variant="filled" action={<Button color="inherit" size="small" onClick={refetchSignals}>Retry</Button>}>
          {signalsError}
        </Alert>
      </Box>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
        <Alert severity="info" variant="filled" sx={{ borderRadius: 2 }}>
          No signals found for this asset. Please assign signals in the Configuration tab.
        </Alert>
      </Box>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <Box sx={{ width: '100%', p: { xs: 1.5, sm: 2.5, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* 1. HEADER BANNER */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: 3,
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          color: 'white',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SensorsIcon sx={{ color: '#818cf8' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                Live Signal Telemetry
              </Typography>
              <Typography variant="caption" sx={{ color: '#c7d2fe' }}>
                Asset ID: {assetId} • Real-time Monitoring & Diagnostics
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip icon={<ShowChartIcon sx={{ fontSize: '16px !important', color: '#a5b4fc !important' }} />} label={`${selectedCount}/${signals.length} Active`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#e0e7ff' }} />
            <Chip label={`${totalDataPoints.toLocaleString()} Points`} size="small" sx={{ bgcolor: hasChartData ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: hasChartData ? '#86efac' : '#fef08a' }} />
            <IconButton size="small" onClick={handleRefresh} disabled={chartLoading} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Paper>

      {/* 2. TABS & CONTROLS TOOLBAR */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box sx={{ bgcolor: '#f1f5f9', p: 0.5, borderRadius: 2.5, display: 'inline-flex' }}>
              <Tabs
                value={timeLevel}
                onChange={handleTimeLevelChange}
                sx={{
                  minHeight: 38,
                  '& .MuiTab-root': {
                    minHeight: 38,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2.5,
                    color: '#64748b',
                    '&.Mui-selected': { color: '#4338ca', bgcolor: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
                  },
                  '& .MuiTabs-indicator': { display: 'none' },
                }}
              >
                {TIME_LEVELS.map((level) => (
                  <Tab
                    key={level.id}
                    value={level.id}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{level.label}</span>
                        <Chip label={level.description} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: timeLevel === level.id ? '#e0e7ff' : '#e2e8f0' }} />
                      </Stack>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: '#f8fafc', px: 2, py: 1, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: '#6366f1' }} />
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                {calculatedStartTime.toLocaleDateString()} {calculatedStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' → '}
                {currentEndTime.toLocaleDateString()} {currentEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#f1f5f9' }} />

          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="window-select-label">Resolution Window</InputLabel>
              <Select
                labelId="window-select-label"
                value={currentWindowHours}
                label="Resolution Window"
                onChange={(e) => handleWindowChange(Number(e.target.value))}
                sx={{ borderRadius: 2 }}
              >
                {currentLevelConfig.windowOptions.map((opt) => (
                  <MenuItem key={opt.hours} value={opt.hours}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Anchor End Time"
              type="datetime-local"
              value={formatDateTimeLocal(currentEndTime)}
              onChange={(e) => handleEndTimeChange(new Date(e.target.value))}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><CalendarIcon fontSize="small" sx={{ color: '#64748b' }} /></InputAdornment>,
              }}
              sx={{ minWidth: 230, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Button
              variant="contained"
              size="medium"
              onClick={handleApply}
              startIcon={<FilterListIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3, bgcolor: '#4338ca', '&:hover': { bgcolor: '#3730a3' } }}
            >
              Apply Window
            </Button>
          </Box>
        </Stack>
      </Paper>


      {/* 4. MAIN LAYOUT */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, width: '100%' }}>
        
        {/* LEFT PANEL: TABLE */}
        <Box sx={{ width: { xs: '100%', md: '280px' }, flexShrink: 0 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              p: 2,
              border: '1px solid #e2e8f0',
              height: '100%',
              minHeight: 520,
              maxHeight: 560,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            <Box mb={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Signal Selection
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Toggle signals to plot
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <SignalTable
                signals={signals}
                selectedIds={selectedIds}
                onToggle={toggleSignal}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                latestValues={latestValuesFromChart}
                onUpdateConfig={handleSignalConfigUpdate}
                timeLevel={timeLevel}
              />
            </Box>
          </Paper>
        </Box>

        {/* RIGHT PANEL: CHART */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              p: 2.5,
              minHeight: 520,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e2e8f0',
              boxSizing: 'border-box',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Trend Visualization
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {currentLevelConfig.label} View ({currentWindowHours}h Window)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, width: '100%', minWidth: 0, minHeight: 440, display: 'flex', flexDirection: 'column' }}>
              {chartLoading ? (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={440}>
                  <CircularProgress size={32} sx={{ color: '#4338ca', mb: 2 }} />
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Querying timeseries telemetry...
                  </Typography>
                </Box>
              ) : hasChartData ? (
                <Box sx={{ width: '100%', height: '100%', flex: 1, minWidth: 0 }}>
                  <TrendChart
                    key={`${timeLevel}-${currentWindowHours}`}
                    signals={selectedSignalData}
                    signalData={chartData}
                    timeLevel={timeLevel}
                    startTime={calculatedStartTime}
                    endTime={currentEndTime}
                    xMin={calculatedStartTime}
                    xMax={currentEndTime}
                    latestValues={latestValuesFromChart}
                    height={440}
                    isLoading={chartLoading}
                    onSignalClick={handleSignalSelect}
                    maxPoints={MAX_POINTS}
                  />
                </Box>
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  height={440}
                  sx={{ bgcolor: '#fef2f2', borderRadius: 2, border: '1px dashed #fca5a5' }}
                >
                  <Typography variant="h2" sx={{ color: '#dc2626', fontWeight: 700, fontSize: '3rem' }}>
                    -1
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#b91c1c', mt: 1 }}>
                    No data in this time range
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#991b1b', mt: 0.5 }}>
                    {calculatedStartTime.toLocaleString()} → {currentEndTime.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#991b1b' }}>
                    Try adjusting the window or end time.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* SETTINGS DRAWER */}
      <Drawer anchor="right" open={showSettings && !!selectedSignalId} onClose={closeSettings} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Parameter Config</Typography>
          <IconButton onClick={closeSettings} size="small"><CloseIcon /></IconButton>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        {selectedSignalId && (
          <SignalSettings
            signal={signals.find((s) => s.signal_id === selectedSignalId)}
            onUpdate={handleSignalConfigUpdate}
            loading={updateLoading}
          />
        )}
      </Drawer>
    </Box>
  );
};

export default LiveMonitoring;
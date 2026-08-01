/**
 * Live Monitoring Component – Generous Default Ranges (No Auto-Adjust)
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
  useTimeRange,
  useUpdateSignalConfig,
} from '../../../../../../hooks/useMonitoringData';

import { getSignalDataRange, getSignalData } from '../../../../../../api/monitoring';

// ============================================================
// TIME LEVELS CONFIGURATION – Generous Defaults
// ============================================================
const TIME_LEVELS = [
  { id: 'raw', label: 'Real-time', description: '1 sec', defaultHours: 20, maxDays: 30 },
  { id: 'minute', label: 'Minute', description: '1 min avg', defaultHours: 10, maxDays: 730 }, // 30 days
  { id: 'hour', label: 'Hour', description: '1 hour avg', defaultHours: 2160, maxDays: 10950 }, // 90 days
];

const LiveMonitoring = ({ asset, assetId, plantId: propPlantId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const plantId = propPlantId || asset?.plant_id;
  const MAX_POINTS = 10000;

  // ============================================================
  // State
  // ============================================================
  const [timeLevel, setTimeLevel] = useState('raw');
  const [selectedSignalId, setSelectedSignalId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dataRange, setDataRange] = useState({ min_timestamp: null, max_timestamp: null });
  const [isLoadingRange, setIsLoadingRange] = useState(false);
  const [chartData, setChartData] = useState({});
  const [chartLoading, setChartLoading] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const initialLoadDone = useRef(false);

  // ============================================================
  // Hooks
  // ============================================================
  const { startTime, endTime, setRange, setRangeFromDates } = useTimeRange(24);

  const {
    signals,
    loading: signalsLoading,
    error: signalsError,
    refetch: refetchSignals,
  } = useSignals(plantId, assetId, false);

  const {
    selectedIds,
    toggleSignal,
    selectAll,
    deselectAll,
    isSelected,
    count: selectedCount,
  } = useSignalSelection(signals);

  // ============================================================
  // Auto-select on load
  // ============================================================
  useEffect(() => {
    if (signals.length > 0 && selectedIds.size === 0 && !initialLoadDone.current) {
      selectAll();
      initialLoadDone.current = true;
    }
  }, [signals, selectAll, selectedIds]);

  const selectedSignalIds = useMemo(
    () => signals.filter(s => isSelected(s.signal_id)).map(s => s.signal_id),
    [signals, isSelected]
  );

  // ============================================================
  // Fetch data range (min/max timestamps) for the signal
  // ============================================================
  useEffect(() => {
    const fetchDataRange = async () => {
      if (selectedSignalIds.length === 1) {
        setIsLoadingRange(true);
        try {
          const range = await getSignalDataRange(selectedSignalIds[0]);
          setDataRange(range);
          if (range.min_timestamp && range.max_timestamp) {
            const minDate = new Date(range.min_timestamp);
            const maxDate = new Date(range.max_timestamp);
            const padding = (maxDate - minDate) * 0.1;
            setRangeFromDates(
              new Date(minDate.getTime() - padding),
              new Date(maxDate.getTime() + padding)
            );
          }
        } catch (error) {
          console.error('Failed to fetch data range:', error);
        } finally {
          setIsLoadingRange(false);
        }
      } else {
        setDataRange({ min_timestamp: null, max_timestamp: null });
        const now = new Date();
        const level = TIME_LEVELS.find(t => t.id === timeLevel);
        const defaultHours = level?.defaultHours || 24;
        setRange(new Date(now.getTime() - defaultHours * 60 * 60 * 1000), now);
      }
    };
    fetchDataRange();
  }, [selectedSignalIds, timeLevel, setRange, setRangeFromDates]);

  // ============================================================
  // Fetch chart data – uses the current range (startTime/endTime)
  // ============================================================
  useEffect(() => {
    const fetchChartData = async () => {
      if (selectedSignalIds.length === 0) {
        setChartData({});
        setChartLoading(false);
        return;
      }

      const now = new Date();
      let start, end;

      // Use the current state range (set by handleTimeLevelChange or user)
      start = startTime || new Date(now.getTime() - 24 * 60 * 60 * 1000);
      end = endTime || now;

      const startStr = start.toISOString();
      const endStr = end.toISOString();

      console.log(`📊 Fetching ${timeLevel} data: ${startStr} → ${endStr}`);

      setChartLoading(true);
      try {
        const dataMap = { ...chartData };
        const signalsToFetch = selectedSignalIds.filter(
          id => !dataMap[id] || dataMap[id].length === 0
        );

        if (signalsToFetch.length === 0) {
          setChartData(dataMap);
          setChartLoading(false);
          return;
        }

        for (const signalId of signalsToFetch) {
          const response = await getSignalData(signalId, timeLevel, {
            start_time: startStr,
            end_time: endStr,
            max_points: MAX_POINTS,
          });
          console.log(`📊 Signal ${signalId} (${timeLevel}): ${response.data_points?.length || 0} points`);
          dataMap[signalId] = response.data_points || [];
        }
        setChartData(dataMap);
      } catch (error) {
        console.error('❌ Failed to fetch chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedSignalIds.join(','), timeLevel, startTime, endTime, forceRefresh]);

  // ============================================================
  // Latest values
  // ============================================================
  const {
    values: latestValues,
    loading: latestLoading,
    refetch: refetchLatest,
  } = useLatestValues(selectedSignalIds);

  const { updateConfig, loading: updateLoading } = useUpdateSignalConfig();

  // ============================================================
  // Handlers
  // ============================================================
  const handleTimeLevelChange = useCallback((event, newValue) => {
    const level = TIME_LEVELS.find(t => t.id === newValue);
    const now = new Date();
    // ✅ Set the default range based on TIME_LEVELS
    const start = new Date(now.getTime() - level.defaultHours * 60 * 60 * 1000);
    setRange(start, now);
    setTimeLevel(newValue);
    setChartData({});
    setChartLoading(true);
  }, [setRange]);

  const handleTimeRangeChange = useCallback((start, end) => {
    setRange(start, end);
  }, [setRange]);

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

  const handleRefresh = useCallback(() => {
    refetchLatest();
    refetchSignals();
    setForceRefresh(prev => prev + 1);
  }, [refetchLatest, refetchSignals]);

  const closeSettings = () => setShowSettings(false);

  const selectedSignalData = useMemo(
    () => signals.filter(s => isSelected(s.signal_id)),
    [signals, isSelected]
  );

  const selectedTimeLevel = TIME_LEVELS.find(t => t.id === timeLevel);

  // ============================================================
  // Compute actual data range from loaded chart data
  // ============================================================
  const totalDataPoints = Object.values(chartData).reduce((sum, data) => sum + (data?.length || 0), 0);
  const hasChartData = selectedSignalIds.length > 0 && totalDataPoints > 0;

  const dataRangeDisplay = useMemo(() => {
    if (!hasChartData) return null;
    const allPoints = Object.values(chartData).flat();
    if (allPoints.length === 0) return null;
    const timestamps = allPoints.map(p => new Date(p.timestamp));
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));
    return { start: min, end: max };
  }, [chartData, hasChartData]);

  // ============================================================
  // Loading states
  // ============================================================
  if (signalsLoading || isLoadingRange) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400} width="100%">
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
          Loading signals...
        </Typography>
      </Box>
    );
  }

  if (signalsError) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Alert severity="error" action={<Button size="small" onClick={refetchSignals}>Retry</Button>}>
          {signalsError}
        </Alert>
      </Box>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
        <Alert severity="info" icon={<SettingsIcon />}>
          No signals assigned to this asset.
          <Button size="small" sx={{ ml: 2 }} variant="outlined">
            Go to Signal Configuration
          </Button>
        </Alert>
      </Box>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>

      {/* ===== HEADER BANNER ===== */}
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
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Live Monitoring
          </Typography>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mt={0.5}>
            <Chip
              label={`${selectedCount} of ${signals.length} signals`}
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
            />
            {!chartLoading && (
              <Chip
                label={`${totalDataPoints} points`}
                size="small"
                sx={{ backgroundColor: hasChartData ? 'rgba(76,175,80,0.3)' : 'rgba(255,193,7,0.3)', color: 'white' }}
              />
            )}
            {dataRangeDisplay && (
              <Chip
                label={`${dataRangeDisplay.start.toLocaleString()} → ${dataRangeDisplay.end.toLocaleString()}`}
                size="small"
                sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
              />
            )}
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Refresh Data">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={latestLoading}
              sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' } }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ===== TIME LEVEL TABS ===== */}
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={2} mb={2.5}>
        <Paper
          elevation={0}
          sx={{
            p: 0.5,
            borderRadius: 2,
            bgcolor: '#f1f5f9',
            display: 'inline-flex',
          }}
        >
          <Tabs
            value={timeLevel}
            onChange={handleTimeLevelChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                borderRadius: 1.5,
                px: 2.5,
                py: 0.5,
                transition: 'all 0.2s',
                color: '#64748b',
                '&.Mui-selected': {
                  color: '#0f172a',
                  fontWeight: 600,
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                },
              },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            {TIME_LEVELS.map((level) => (
              <Tab
                key={level.id}
                value={level.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight="inherit">
                      {level.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 400 }}>
                      {level.description}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Paper>
        <Chip
          label={`Default: ${selectedTimeLevel?.defaultHours}h`}
          size="small"
          variant="outlined"
          sx={{ borderColor: '#667eea', color: '#667eea' }}
        />
      </Box>

      {/* ===== TIME RANGE PICKER ===== */}
      <Box sx={{ mb: 2.5 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            label="Start Date/Time"
            type="datetime-local"
            value={startTime ? startTime.toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              if (e.target.value) {
                const newStart = new Date(e.target.value);
                setRange(newStart, endTime);
              }
            }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 200,
              '& .MuiInputBase-root': { bgcolor: 'white' },
            }}
          />
          <Typography variant="body2" color="text.secondary">→</Typography>
          <TextField
            label="End Date/Time"
            type="datetime-local"
            value={endTime ? endTime.toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              if (e.target.value) {
                const newEnd = new Date(e.target.value);
                setRange(startTime, newEnd);
              }
            }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 200,
              '& .MuiInputBase-root': { bgcolor: 'white' },
            }}
          />
        </Box>
      </Box>

      {/* ===== QUICK STATS ===== */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1.5,
          mb: 2.5,
          width: '100%',
        }}
      >
        {[
          { label: 'Total Signals', value: signals.length },
          { label: 'Selected', value: selectedCount, color: '#10b981' },
          { label: 'Data Points', value: totalDataPoints },
          { label: 'Time Level', value: selectedTimeLevel?.label },
        ].map((item, idx) => (
          <Box key={idx} sx={{ background: 'white', borderRadius: 2, p: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>{item.label}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: item.color || '#0f172a' }}>{item.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* ===== REAL-TIME VALUES ===== */}
      <Box
        sx={{
          background: 'white',
          borderRadius: 2,
          p: 1.5,
          mb: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          width: '100%',
        }}
      >
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

      {/* ===== MAIN: SIGNAL TABLE + CHART ===== */}
      <Grid container spacing={2.5} sx={{ width: '100%' }}>
        <Grid item xs={12} md={2} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              background: 'white',
              borderRadius: 2,
              p: 1.5,
              border: '1px solid #e2e8f0',
              height: '100%',
              maxHeight: 520,
              overflow: 'auto',
              width: '100%',
            }}
          >
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
          <Box
            sx={{
              background: 'white',
              borderRadius: 2,
              p: 1.5,
              border: '1px solid #e2e8f0',
              height: '100%',
              minHeight: 420,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
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
                startTime={startTime}
                endTime={endTime}
                latestValues={latestValues}
                height={420}
                isLoading={chartLoading}
                onSignalClick={handleSignalSelect}
                maxPoints={MAX_POINTS}
              />
            ) : totalDataPoints === 0 && !chartLoading && selectedSignalIds.length > 0 ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={420} bgcolor="#fafafa" borderRadius={2} gap={2}>
                <Typography variant="body1" color="text.secondary">⏳ No data points loaded yet</Typography>
                <Typography variant="caption" color="text.secondary">Try refreshing or check the DCS generator.</Typography>
                <Button variant="outlined" size="small" onClick={handleRefresh} startIcon={<RefreshIcon />}>Refresh</Button>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={420} bgcolor="#fafafa" borderRadius={2} gap={1}>
                <Typography variant="body2" color="text.secondary">Select a signal from the list to view data.</Typography>
                <Typography variant="caption" color="text.secondary">{signals.length} signals available</Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* ===== DRAWER: Signal Settings ===== */}
      <Drawer
        anchor="right"
        open={showSettings && !!selectedSignalId && !!signals.find(s => s.signal_id === selectedSignalId)}
        onClose={closeSettings}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420, md: 480 },
            p: 2,
            borderRadius: { xs: 0, sm: '16px 0 0 16px' },
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">Signal Settings</Typography>
          <IconButton onClick={closeSettings}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {selectedSignalId && (
          <SignalSettings
            signal={signals.find(s => s.signal_id === selectedSignalId)}
            onUpdate={handleSignalConfigUpdate}
            loading={updateLoading}
          />
        )}
      </Drawer>

    </Box>
  );
};

export default LiveMonitoring;
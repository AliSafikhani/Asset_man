/**
 * Live Monitoring Component – With Actual Data Range Chip
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
  Collapse,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CompareArrows as CompareIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

import SignalTable from './SignalTable';
import TrendChart from './TrendChart';
import DataTimeline from './DataTimeline';
import ComparisonPanel from './ComparisonPanel';
import RealTimeValues from './RealTimeValues';
import SignalSettings from './SignalSettings';

import {
  useSignals,
  useSignalTimeline,
  useLatestValues,
  useSignalSelection,
  useTimeRange,
  useUpdateSignalConfig,
} from '../../../../../../hooks/useMonitoringData';

import { getSignalDataRange, getSignalData } from '../../../../../../api/monitoring';

const TIME_LEVELS = [
  { id: 'raw', label: 'Real-time', description: '1 second', maxDays: 2, defaultHours: 48, isFixedRange: true },
  { id: 'minute', label: 'Minute', description: '1 min avg', maxDays: 730, defaultHours: 168, isFixedRange: false },
  { id: 'hour', label: 'Hour', description: '1 hour avg', maxDays: 10950, defaultHours: 720, isFixedRange: false },
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
  const [showTimeline, setShowTimeline] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [dataRange, setDataRange] = useState({ min_timestamp: null, max_timestamp: null });
  const [isLoadingRange, setIsLoadingRange] = useState(false);
  const [chartData, setChartData] = useState({});
  const [chartLoading, setChartLoading] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const initialLoadDone = useRef(false);

  // ============================================================
  // Hooks
  // ============================================================
  const { startTime, endTime, hours, setRange, setRangeFromDates, format: timeFormat } = useTimeRange(24);

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
  // AUTO-SELECT SIGNALS ON LOAD
  // ============================================================
  useEffect(() => {
    if (signals.length > 0 && selectedIds.size === 0 && !initialLoadDone.current) {
      console.log('🔄 Auto-selecting all signals:', signals.map(s => s.signal_id));
      selectAll();
      initialLoadDone.current = true;
    }
  }, [signals, selectAll, selectedIds]);

  // ============================================================
  // Derived state
  // ============================================================
  const selectedSignalIds = useMemo(
    () => signals.filter(s => isSelected(s.signal_id)).map(s => s.signal_id),
    [signals, isSelected]
  );

  // ============================================================
  // Data range
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
  // CHART DATA FETCH – Single source of truth
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

      if (timeLevel === 'raw') {
        // ✅ RAW: Always use last 48 hours, ending at NOW
        start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        end = now;
      } else {
        // ✅ Minute / Hour: use dataRange if available, otherwise fallback to defaults
        if (dataRange.min_timestamp && dataRange.max_timestamp) {
          start = new Date(dataRange.min_timestamp);
          end = new Date(dataRange.max_timestamp);
        } else {
          const defaultHours = TIME_LEVELS.find(t => t.id === timeLevel)?.defaultHours || 24;
          start = new Date(now.getTime() - defaultHours * 60 * 60 * 1000);
          end = now;
        }
      }

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
  }, [selectedSignalIds.join(','), timeLevel, dataRange, forceRefresh]);

  // ============================================================
  // Timeline
  // ============================================================
  const {
    intervals: timelineData,
    loading: timelineLoading,
    error: timelineError,
  } = useSignalTimeline(
    selectedSignalIds.length === 1 ? selectedSignalIds[0] : null,
    timeLevel,
    {
      start_time: timeFormat.start,
      end_time: timeFormat.end,
      hours: hours,
    }
  );

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
    console.log(`🔄 Switching to ${newValue} tab`);
    setTimeLevel(newValue);
    setChartData({});
    setChartLoading(true);

    const level = TIME_LEVELS.find(t => t.id === newValue);
    
    // 🔥 RAW: Always use last 48 hours (ignore dataRange)
    if (newValue === 'raw') {
      const now = new Date();
      const start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      setRange(start, now);
    } else if (dataRange.min_timestamp && dataRange.max_timestamp) {
      const minDate = new Date(dataRange.min_timestamp);
      const maxDate = new Date(dataRange.max_timestamp);
      const padding = (maxDate - minDate) * 0.1;
      setRangeFromDates(
        new Date(minDate.getTime() - padding),
        new Date(maxDate.getTime() + padding)
      );
    } else {
      const defaultHours = level?.defaultHours || 24;
      const now = new Date();
      setRange(new Date(now.getTime() - defaultHours * 60 * 60 * 1000), now);
    }
  }, [dataRange, setRange, setRangeFromDates]);

  const handleTimeRangeChange = useCallback((start, end) => {
    setRange(start, end);
  }, [setRange]);

  const handleSignalSelect = useCallback((signalId) => {
    setSelectedSignalId(signalId);
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
    console.log('🔄 Manual refresh triggered');
    refetchLatest();
    refetchSignals();
    setForceRefresh(prev => prev + 1);
  }, [refetchLatest, refetchSignals]);

  const toggleTimeline = () => setShowTimeline(!showTimeline);
  const toggleComparison = () => setShowComparison(!showComparison);

  const selectedSignalData = useMemo(
    () => signals.filter(s => isSelected(s.signal_id)),
    [signals, isSelected]
  );

  const selectedTimeLevel = TIME_LEVELS.find(t => t.id === timeLevel);
  const isRangeFixed = selectedTimeLevel?.isFixedRange || false;

  // ============================================================
  // COMPUTE ACTUAL DATA RANGE FROM LOADED CHART DATA
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
          marginBottom: 3,
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
            {isRangeFixed && (
              <Chip
                label="2 Days Fixed"
                size="small"
                sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
              />
            )}
            {!chartLoading && (
              <Chip
                label={`${totalDataPoints} points`}
                size="small"
                sx={{ backgroundColor: hasChartData ? 'rgba(76,175,80,0.3)' : 'rgba(255,193,7,0.3)', color: 'white' }}
              />
            )}
            {/* 🔥 NEW: Actual data range chip */}
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
          <Button
            size="small"
            variant="contained"
            startIcon={<CompareIcon />}
            onClick={toggleComparison}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
            }}
          >
            Compare
          </Button>
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
            alignSelf: 'flex-start',
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
                    {level.isFixedRange && (
                      <LockIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {isRangeFixed ? (
            <Chip
              icon={<LockIcon sx={{ fontSize: 14 }} />}
              label={`Last ${selectedTimeLevel?.maxDays} days (fixed)`}
              size="small"
              variant="outlined"
              sx={{ borderColor: '#94a3b8', color: '#64748b' }}
            />
          ) : (
            <Chip
              label={`Range: Up to ${selectedTimeLevel?.maxDays} days`}
              size="small"
              variant="outlined"
              sx={{ borderColor: '#667eea', color: '#667eea' }}
            />
          )}
        </Typography>
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
            disabled={isRangeFixed}
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
              '& .MuiInputBase-root': {
                bgcolor: isRangeFixed ? '#f1f5f9' : 'white',
              },
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
            disabled={isRangeFixed}
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
              '& .MuiInputBase-root': {
                bgcolor: isRangeFixed ? '#f1f5f9' : 'white',
              },
            }}
          />
          {isRangeFixed && (
            <Chip
              icon={<LockIcon sx={{ fontSize: 14 }} />}
              label="Range is fixed to last 2 days"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* ===== QUICK STATS ===== */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 1.5,
          mb: 2.5,
          width: '100%',
        }}
      >
        <Box sx={{ background: 'white', borderRadius: 2, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>Total Signals</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>{signals.length}</Typography>
        </Box>
        <Box sx={{ background: 'white', borderRadius: 2, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>Selected</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>{selectedCount}</Typography>
        </Box>
        <Box sx={{ background: 'white', borderRadius: 2, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>Data Points</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            {totalDataPoints}
          </Typography>
        </Box>
        <Box sx={{ background: 'white', borderRadius: 2, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>Time Level</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>{selectedTimeLevel?.label}</Typography>
        </Box>
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
                <Typography variant="body1" color="text.secondary">
                  ⏳ No data points loaded yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Selected signals: {selectedSignalIds.join(', ')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Try clicking the Refresh button or check if the DCS generator is running.
                </Typography>
                <Button variant="outlined" size="small" onClick={handleRefresh} startIcon={<RefreshIcon />}>
                  Refresh Data
                </Button>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={420} bgcolor="#fafafa" borderRadius={2} gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Select a signal from the list to view data.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {signals.length} signals available
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* ===== FOOTER ===== */}
      <Box mt={2.5} display="flex" flexDirection="column" gap={1} width="100%">

        {/* Timeline */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.2,
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f8fafc' },
              transition: 'background 0.15s',
            }}
            onClick={toggleTimeline}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <TimelineIcon fontSize="small" sx={{ color: '#64748b' }} />
              <Typography variant="body2" fontWeight="600" color="text.secondary">
                Data Availability Timeline
              </Typography>
              {selectedSignalIds.length === 1 && timelineData && timelineData.length > 0 && (
                <Chip label={`${timelineData.length} intervals`} size="small" variant="outlined" />
              )}
            </Box>
            <IconButton size="small">
              {showTimeline ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={showTimeline}>
            <Box sx={{ p: 2, pt: 0 }}>
              {selectedSignalIds.length === 1 ? (
                timelineLoading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={20} />
                  </Box>
                ) : timelineError ? (
                  <Alert severity="error">{timelineError}</Alert>
                ) : !timelineData || timelineData.length === 0 ? (
                  <Alert severity="info">No timeline data available for this signal</Alert>
                ) : (
                  <DataTimeline
                    signalId={selectedSignalIds[0]}
                    timeLevel={timeLevel}
                    intervals={timelineData}
                    loading={timelineLoading}
                    error={timelineError}
                    startTime={startTime}
                    endTime={endTime}
                    onRangeChange={handleTimeRangeChange}
                    height={100}
                  />
                )
              ) : (
                <Alert severity="info">Select a single signal to view data availability</Alert>
              )}
            </Box>
          </Collapse>
        </Paper>

        {/* Comparison */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.2,
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f8fafc' },
              transition: 'background 0.15s',
            }}
            onClick={toggleComparison}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <CompareIcon fontSize="small" sx={{ color: '#64748b' }} />
              <Typography variant="body2" fontWeight="600" color="text.secondary">
                Cross-Asset Comparison
              </Typography>
            </Box>
            <IconButton size="small">
              {showComparison ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={showComparison}>
            <Box sx={{ p: 2, pt: 0 }}>
              <ComparisonPanel
                plantId={plantId}
                currentAssetId={assetId}
                timeLevel={timeLevel}
                startTime={startTime}
                endTime={endTime}
                maxPoints={MAX_POINTS}
              />
            </Box>
          </Collapse>
        </Paper>
      </Box>

      {/* ===== DRAWER: Signal Settings ===== */}
      <Drawer
        anchor="right"
        open={!!selectedSignalId && !!signals.find(s => s.signal_id === selectedSignalId)}
        onClose={() => setSelectedSignalId(null)}
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
          <IconButton onClick={() => setSelectedSignalId(null)}>
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
/**
 * Live Monitoring Component (Professional UI)
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/index.jsx
 * Description: Professional live monitoring with gradient headers, cards, and clean layout
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CompareArrows as CompareIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

// Sub-components
import SignalTable from './SignalTable';
import TrendChart from './TrendChart';
import DataTimeline from './DataTimeline';
import ComparisonPanel from './ComparisonPanel';
import RealTimeValues from './RealTimeValues';

// Hooks
import {
  useSignals,
  useSignalTimeline,
  useLatestValues,
  useSignalSelection,
  useTimeRange,
  useUpdateSignalConfig,
} from '../../../../../../hooks/useMonitoringData';

// API
import { getSignalDataRange, getSignalData } from '../../../../../../api/monitoring';

// ============================================================
// Time Level Configuration
// ============================================================
const TIME_LEVELS = [
  { id: 'raw', label: 'Real-time', description: '1 second interval', maxDays: 30, defaultHours: 24 },
  { id: 'minute', label: 'Minute', description: '1 minute aggregated', maxDays: 730, defaultHours: 168 },
  { id: 'hour', label: 'Hour', description: '1 hour aggregated', maxDays: 10950, defaultHours: 720 },
];

const LiveMonitoring = ({ asset, assetId, plantId: propPlantId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const plantId = propPlantId || asset?.plant_id;

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

  // Time range
  const { startTime, endTime, hours, setRange, setRangeFromDates, format: timeFormat } = useTimeRange(24);

  // ============================================================
  // Data Fetching
  // ============================================================
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

  const selectedSignalIds = useMemo(
    () => signals.filter(s => isSelected(s.signal_id)).map(s => s.signal_id),
    [signals, isSelected]
  );

  // Fetch data range
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
        const defaultHours = TIME_LEVELS.find(t => t.id === timeLevel)?.defaultHours || 24;
        setRange(new Date(now.getTime() - defaultHours * 60 * 60 * 1000), now);
      }
    };
    fetchDataRange();
  }, [selectedSignalIds, timeLevel, setRange, setRangeFromDates]);

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (selectedSignalIds.length === 0) {
        setChartData({});
        return;
      }
      setChartLoading(true);
      try {
        const dataMap = {};
        for (const signalId of selectedSignalIds) {
          const response = await getSignalData(signalId, timeLevel, {
            start_time: timeFormat.start,
            end_time: timeFormat.end,
            hours: hours,
          });
          dataMap[signalId] = response.data_points || [];
        }
        setChartData(dataMap);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChartData();
  }, [selectedSignalIds, timeLevel, timeFormat.start, timeFormat.end, hours]);

  // Timeline
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
    setTimeLevel(newValue);
    const level = TIME_LEVELS.find(t => t.id === newValue);
    if (dataRange.min_timestamp && dataRange.max_timestamp) {
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
    refetchLatest();
    refetchSignals();
  }, [refetchLatest, refetchSignals]);

  const toggleTimeline = () => setShowTimeline(!showTimeline);
  const toggleComparison = () => setShowComparison(!showComparison);

  const selectedSignalData = useMemo(
    () => signals.filter(s => isSelected(s.signal_id)),
    [signals, isSelected]
  );

  const selectedTimeLevel = TIME_LEVELS.find(t => t.id === timeLevel);

  // ============================================================
  // Loading States
  // ============================================================
  if (signalsLoading || isLoadingRange) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
          Loading signals...
        </Typography>
      </Box>
    );
  }

  if (signalsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={<Button size="small" onClick={refetchSignals}>Retry</Button>}
        >
          {signalsError}
        </Alert>
      </Box>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

      {/* ===== HEADER ===== */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: 3,
          padding: { xs: '16px 20px', sm: '20px 28px' },
          marginBottom: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Live Monitoring
          </Typography>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mt={0.5}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {selectedCount} of {signals.length} signals selected
            </Typography>
            {dataRange.min_timestamp && dataRange.max_timestamp && (
              <Chip
                label={`${new Date(dataRange.min_timestamp).toLocaleDateString()} → ${new Date(dataRange.max_timestamp).toLocaleDateString()}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
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
              sx={{
                color: '#94a3b8',
                '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={toggleComparison}
            sx={{
              color: '#94a3b8',
              borderColor: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                borderColor: 'white',
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            Compare
          </Button>
        </Box>
      </Box>

      {/* ===== TIME LEVEL TABS ===== */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
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
            '& .MuiTabs-indicator': {
              display: 'none',
            },
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

      {/* ===== QUICK STATS ===== */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 1.5,
          mb: 2.5,
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
            {Object.values(chartData).reduce((sum, data) => sum + (data?.length || 0), 0)}
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
      <Grid container spacing={2.5}>

        {/* LEFT: Signal Table */}
        <Grid item xs={12} md={2.4}>
          <Box
            sx={{
              background: 'white',
              borderRadius: 2,
              p: 1.5,
              border: '1px solid #e2e8f0',
              height: '100%',
              maxHeight: 520,
              overflow: 'auto',
            }}
          >
            <SignalTable
              signals={signals}
              selectedIds={selectedIds}
              onToggle={toggleSignal}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              latestValues={latestValues}
              onSignalClick={handleSignalSelect}
              onUpdateConfig={handleSignalConfigUpdate}
              timeLevel={timeLevel}
            />
          </Box>
        </Grid>

        {/* RIGHT: Chart */}
        <Grid item xs={12} md={9.6}>
          <Box
            sx={{
              background: 'white',
              borderRadius: 2,
              p: 1.5,
              border: '1px solid #e2e8f0',
              height: '100%',
              minHeight: 400,
            }}
          >
            <TrendChart
              signals={selectedSignalData}
              signalData={chartData}
              timeLevel={timeLevel}
              startTime={startTime}
              endTime={endTime}
              latestValues={latestValues}
              height={400}
              isLoading={chartLoading}
              onSignalClick={handleSignalSelect}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ===== FOOTER ===== */}
      <Box mt={2.5} display="flex" flexDirection="column" gap={1}>

        {/* Timeline */}
        <Box
          sx={{
            background: 'white',
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
                ) : 
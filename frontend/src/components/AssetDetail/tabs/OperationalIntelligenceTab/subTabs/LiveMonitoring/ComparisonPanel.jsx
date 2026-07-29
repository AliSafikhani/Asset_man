/**
 * ComparisonPanel Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/ComparisonPanel.jsx
 * Description: Cross-asset comparison panel for comparing signals across assets
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Button,
  Divider,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CompareArrows as CompareIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

// Import chart components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

// NEW (CORRECT)
import {
  getComparisonGroups,
  getComparisonData,
  getPlantSignals,
} from '../../../../../../api/monitoring';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
  TimeScale
);

// Color palette for comparison
const COMPARE_COLORS = [
  '#2196F3', // Blue
  '#FF5722', // Deep Orange
  '#4CAF50', // Green
  '#9C27B0', // Purple
  '#FFC107', // Amber
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#795548', // Brown
  '#E91E63', // Pink
  '#607D8B', // Blue Grey
];

const ComparisonPanel = ({
  plantId,
  currentAssetId,
  timeLevel = 'raw',
  startTime,
  endTime,
}) => {
  // ============================================================
  // State
  // ============================================================
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [allSignals, setAllSignals] = useState([]);

  // ============================================================
  // Fetch groups on load
  // ============================================================
  useEffect(() => {
    if (!plantId) return;

    const fetchGroups = async () => {
      try {
        const data = await getComparisonGroups(plantId);
        setGroups(data || []);
        if (data && data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      } catch (err) {
        setError('Failed to load comparison groups');
        console.error(err);
      }
    };

    fetchGroups();
  }, [plantId]);

  // ============================================================
  // Fetch all signals for the plant
  // ============================================================
  useEffect(() => {
    if (!plantId) return;

    const fetchSignals = async () => {
      try {
        const data = await getPlantSignals(plantId, true);
        setAllSignals(data?.signals || []);
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      }
    };

    fetchSignals();
  }, [plantId]);

  // ============================================================
  // Fetch comparison data when group or time changes
  // ============================================================
  const fetchComparisonData = useCallback(async () => {
    if (!plantId || !selectedGroupId) return;

    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startTime) params.start_time = startTime.toISOString();
      if (endTime) params.end_time = endTime.toISOString();

      const data = await getComparisonData(
        plantId,
        selectedGroupId,
        timeLevel,
        params
      );

      setComparisonData(data);
      setSelectedAssets([]);
    } catch (err) {
      setError(err.message || 'Failed to load comparison data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [plantId, selectedGroupId, timeLevel, startTime, endTime]);

  // Trigger comparison data fetch
  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleGroupChange = (event) => {
    setSelectedGroupId(event.target.value);
  };

  const handleAssetToggle = (assetId) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    const allAssetIds = availableAssets.map((a) => a.asset_id);
    setSelectedAssets(allAssetIds);
  };

  const handleDeselectAll = () => {
    setSelectedAssets([]);
  };

  const handleRefresh = () => {
    fetchComparisonData();
  };

  // ============================================================
  // Prepare chart data
  // ============================================================
  const chartData = useMemo(() => {
    if (!comparisonData || !comparisonData.signals || selectedAssets.length === 0) {
      return { datasets: [] };
    }

    // Filter signals by selected assets
    const filteredSignals = comparisonData.signals.filter((s) =>
      selectedAssets.includes(s.asset_id)
    );

    if (filteredSignals.length === 0) {
      return { datasets: [] };
    }

    const datasets = filteredSignals.map((signal, index) => {
      const color = COMPARE_COLORS[index % COMPARE_COLORS.length];

      // Determine which field to use based on time level
      let valueKey = 'value';
      if (timeLevel === 'minute' || timeLevel === 'hour') {
        valueKey = 'avg_value';
      }

      return {
        label: `${signal.signal_name} (Asset ${signal.asset_id})`,
        data: (signal.data || []).map((point) => ({
          x: new Date(point.timestamp),
          y: point[valueKey] !== undefined ? point[valueKey] : null,
        })),
        borderColor: color,
        backgroundColor: color + '33',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.1,
        fill: false,
        spanGaps: false,
      };
    });

    return { datasets };
  }, [comparisonData, selectedAssets, timeLevel]);

  // ============================================================
  // Chart options
  // ============================================================
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
            padding: 20,
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            title: (items) => {
              if (items && items.length > 0) {
                return new Date(items[0].parsed.x).toLocaleString();
              }
              return '';
            },
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value === null || value === undefined) return null;
              return `${label}: ${value.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM d',
              month: 'MMM yyyy',
            },
          },
          grid: { display: true },
          ticks: {
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20,
          },
        },
        y: {
          beginAtZero: false,
          grid: { display: true },
          ticks: {
            callback: (value) => {
              if (value === null || value === undefined) return '';
              return value.toFixed(1);
            },
          },
        },
      },
    };
  }, []);

  // ============================================================
  // Format date for display
  // ============================================================
  const formatDate = useCallback((date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // ============================================================
  // Render loading state
  // ============================================================
  if (loading && !comparisonData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={32} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading comparison data...
        </Typography>
      </Box>
    );
  }

  // ============================================================
  // Render error state
  // ============================================================
  if (error) {
    return (
      <Box p={2}>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <Box>
      {/* Controls */}
      <Grid container spacing={2} alignItems="center" mb={2}>
        {/* Group Selector */}
        <Grid item xs={12} md={4}>
          <FormControl size="small" fullWidth>
            <InputLabel>Comparison Group</InputLabel>
            <Select
              value={selectedGroupId || ''}
              onChange={handleGroupChange}
              label="Comparison Group"
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                  {group.group_type && (
                    <Chip
                      label={group.group_type}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1, height: 16, fontSize: '0.5rem' }}
                    />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Time Range Info */}
        <Grid item xs={12} md={4}>
          <Typography variant="caption" color="text.secondary">
            <strong>Range:</strong> {formatDate(startTime)} → {formatDate(endTime)}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            <strong>Level:</strong> {timeLevel === 'raw' ? 'Raw (1Hz)' : timeLevel === 'minute' ? '1-Minute' : '1-Hour'}
          </Typography>
        </Grid>

        {/* Refresh */}
        <Grid item xs={12} md={4} display="flex" justifyContent="flex-end">
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>

      {/* Asset Selection */}
      {comparisonData && comparisonData.signals && (
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2">
              Select Assets to Compare
            </Typography>
            <Box>
              <Button size="small" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button size="small" onClick={handleDeselectAll}>
                Clear
              </Button>
            </Box>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1}>
            {comparisonData.signals.map((signal, index) => {
              const assetId = signal.asset_id;
              const assetName = `Asset ${assetId}`;
              const color = COMPARE_COLORS[index % COMPARE_COLORS.length];
              const isSelected = selectedAssets.includes(assetId);

              return (
                <Chip
                  key={assetId}
                  label={assetName}
                  onClick={() => handleAssetToggle(assetId)}
                  icon={
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? color : '#ccc',
                      }}
                    />
                  }
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  clickable
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Chart */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          height: 350,
          position: 'relative',
          bgcolor: 'background.paper',
        }}
      >
        {selectedAssets.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100%"
            gap={1}
          >
            <CompareIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              Select at least one asset to compare
            </Typography>
          </Box>
        ) : chartData.datasets.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography variant="body2" color="text.secondary">
              No data available for the selected assets
            </Typography>
          </Box>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </Paper>

      {/* Legend / Stats */}
      {selectedAssets.length > 0 && comparisonData && (
        <Box mt={1}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                <strong>Group:</strong> {comparisonData.group?.name || 'N/A'}
                {comparisonData.group?.group_type && (
                  <Chip
                    label={comparisonData.group.group_type}
                    size="small"
                    sx={{ ml: 1, height: 16, fontSize: '0.5rem' }}
                  />
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" align="right" display="block">
                <strong>Assets:</strong> {selectedAssets.length} selected
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ComparisonPanel;
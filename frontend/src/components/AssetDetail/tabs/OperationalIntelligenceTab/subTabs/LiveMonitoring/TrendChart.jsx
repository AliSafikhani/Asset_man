/**
 * TrendChart Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/TrendChart.jsx
 * Description: Professional chart with controls (legend, grid, zoom, download)
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Stack,
  Button,
} from '@mui/material';
import {
  RestartAlt as ResetIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
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
  Colors,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
  TimeScale,
  Colors,
  zoomPlugin
);

const CHART_COLORS = [
  '#2196F3', '#FF5722', '#4CAF50', '#FFC107', '#9C27B0',
  '#F44336', '#00BCD4', '#FF9800', '#795548', '#607D8B',
  '#E91E63', '#8BC34A',
];

const LINE_STYLES = {
  solid: [],
  dashed: [6, 4],
  dotted: [2, 4],
  dashdot: [6, 4, 2, 4],
};

const TrendChart = ({
  signals = [],
  signalData = {},
  timeLevel = 'raw',
  startTime,
  endTime,
  latestValues = {},
  onSignalClick,
  height = 400,
  isLoading = false,
  error = null,
}) => {
  const chartRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [chartKey, setChartKey] = useState(0);

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

  const getTimeUnit = useCallback(() => {
    if (!startTime || !endTime) return 'hour';
    const diffDays = (endTime - startTime) / (1000 * 60 * 60 * 24);
    if (diffDays <= 1) return 'minute';
    if (diffDays <= 7) return 'hour';
    if (diffDays <= 30) return 'day';
    if (diffDays <= 365) return 'month';
    return 'year';
  }, [startTime, endTime]);

  const getDisplayName = useCallback((s) => s.custom_name || s.name || `Signal ${s.signal_id}`, []);
  const getColor = useCallback((s, i) => s.color_hex || CHART_COLORS[i % CHART_COLORS.length], []);
  const getLineStyle = useCallback((s) => LINE_STYLES[s.line_type || 'solid'] || [], []);

  const chartData = useMemo(() => {
    const activeSignals = signals.filter((s) => signalData[s.signal_id]?.length > 0);
    if (activeSignals.length === 0) return { datasets: [] };

    const datasets = activeSignals.map((signal, index) => {
      const data = signalData[signal.signal_id] || [];
      const color = getColor(signal, index);
      const lineStyle = getLineStyle(signal);
      const valueKey = timeLevel === 'minute' || timeLevel === 'hour' ? 'avg_value' : 'value';

      return {
        label: getDisplayName(signal),
        data: data.map((point) => ({
          x: new Date(point.timestamp),
          y: point[valueKey] !== undefined ? point[valueKey] : null,
        })),
        borderColor: color,
        backgroundColor: color + '22',
        borderWidth: signal.line_width || 2,
        borderDash: lineStyle,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.15,
        fill: false,
        spanGaps: false,
      };
    });

    return { datasets };
  }, [signals, signalData, timeLevel, getDisplayName, getColor, getLineStyle]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          padding: 16,
          font: { size: 11, weight: '500' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: '#fff',
        bodyColor: '#e0e0e0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items) => items.length > 0 ? formatDate(items[0].parsed.x) : '',
          label: (ctx) => {
            const label = ctx.dataset.label || '';
            const value = ctx.parsed.y;
            return value !== null && value !== undefined ? `${label}: ${value.toFixed(2)}` : null;
          },
        },
      },
      zoom: {
        pan: { enabled: true, mode: 'x', modifierKey: 'shift' },
        zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: getTimeUnit(),
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM d',
            month: 'MMM yyyy',
            year: 'yyyy',
          },
        },
        grid: { display: showGrid, drawBorder: true },
        ticks: { maxRotation: 30, autoSkip: true, maxTicksLimit: 25 },
      },
      y: {
        beginAtZero: false,
        grid: { display: showGrid, drawBorder: true },
        ticks: { callback: (v) => v !== null && v !== undefined ? v.toFixed(1) : '' },
      },
    },
    elements: { line: { borderJoinStyle: 'round' } },
    animation: { duration: 300 },
  }), [showLegend, showGrid, getTimeUnit, formatDate]);

  // Handlers
  const handleResetZoom = useCallback(() => chartRef.current?.resetZoom(), []);
  const handleDownload = useCallback(() => {
    if (!chartRef.current) return;
    const link = document.createElement('a');
    link.download = `trend_chart_${new Date().toISOString().slice(0,10)}.png`;
    link.href = chartRef.current.canvas.toDataURL('image/png', 1.0);
    link.click();
  }, []);
  const handleFullscreen = useCallback(() => setIsFullscreen((p) => !p), []);

  useEffect(() => {
    setChartKey((p) => p + 1);
  }, [signals, timeLevel, startTime, endTime, signalData]);

  // Loading
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress size={32} />
        <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
          Loading chart data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box height={height} p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height} bgcolor="action.hover" borderRadius={2}>
        <Typography variant="body2" color="text.secondary">
          No signals selected. Check signals in the list to display.
        </Typography>
      </Box>
    );
  }

  const hasData = chartData.datasets.some((ds) => ds.data.length > 0);

  if (!hasData) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={height} bgcolor="action.hover" borderRadius={2} gap={1}>
        <Typography variant="body2" color="text.secondary">
          No data available for the selected time range.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Try selecting a different time range or data level.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: isFullscreen ? 'calc(100vh - 64px)' : height, width: '100%', transition: 'height 0.3s' }}>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" px={1} py={0.5} bgcolor="action.hover" borderRadius="4px 4px 0 0" flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="caption" color="text.secondary" fontWeight="500">
            {timeLevel === 'raw' ? 'Real-time (1Hz)' : timeLevel === 'minute' ? '1-Minute Avg' : '1-Hour Avg'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(startTime)} → {formatDate(endTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {signals.filter(s => signalData[s.signal_id]?.length > 0).length} signals
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <FormControlLabel
            control={<Switch size="small" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} />}
            label={<Typography variant="caption">Legend</Typography>}
          />
          <FormControlLabel
            control={<Switch size="small" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />}
            label={<Typography variant="caption">Grid</Typography>}
          />
          <Tooltip title="Reset Zoom"><IconButton size="small" onClick={handleResetZoom}><ResetIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Download PNG"><IconButton size="small" onClick={handleDownload}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton size="small" onClick={handleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Chart */}
      <Box sx={{ height: `calc(100% - 38px)`, width: '100%', position: 'relative', bgcolor: 'background.paper', borderRadius: '0 0 4px 4px', border: '1px solid', borderColor: 'divider', borderTop: 'none' }}>
        <Line ref={chartRef} key={chartKey} data={chartData} options={chartOptions} onClick={(e, elements) => {
          if (elements?.length > 0) {
            const signal = signals[elements[0].datasetIndex];
            if (signal && onSignalClick) onSignalClick(signal.signal_id);
          }
        }} />
      </Box>

      {/* Zoom hint */}
      <Box position="absolute" bottom={8} right={8} bgcolor="rgba(0,0,0,0.5)" color="white" px={1.5} py={0.5} borderRadius={1} fontSize="0.55rem" sx={{ opacity: 0.5 }}>
        Scroll to zoom · Shift+drag to pan
      </Box>
    </Box>
  );
};

export default TrendChart;
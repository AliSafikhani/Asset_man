/**
 * TrendChart Component – Fixed x‑axis labels
 */
import React, { useRef, useMemo, useState, useCallback } from 'react';
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
} from '@mui/material';
import {
  RestartAlt as ResetIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
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
  Decimation,
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
  zoomPlugin,
  Decimation
);

const COLORS = ['#2196F3', '#FF5722', '#4CAF50', '#FFC107', '#9C27B0'];

const TrendChart = ({
  signals = [],
  signalData = {},
  timeLevel = 'raw',
  startTime,
  endTime,
  onSignalClick,
  height = 400,
  isLoading = false,
  error = null,
}) => {
  const chartRef = useRef(null);
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartData = useMemo(() => {
    const activeSignals = signals.filter((s) => signalData[s.signal_id]?.length > 0);
    if (activeSignals.length === 0) return { datasets: [] };

    const datasets = activeSignals.map((signal, idx) => {
      const points = signalData[signal.signal_id] || [];
      const color = signal.color_hex || COLORS[idx % COLORS.length];
      const label = signal.custom_name || signal.name || `Signal ${signal.signal_id}`;

      return {
        label,
        data: points.map((p) => ({ x: new Date(p.timestamp), y: p.avg_value })),
        borderColor: color,
        backgroundColor: color + '33',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        fill: false,
      };
    });

    return { datasets };
  }, [signals, signalData]);

  const hasData = chartData.datasets.some((ds) => ds.data.length > 0);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: showLegend, position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}`,
        },
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true, speed: 0.1 }, mode: 'x' },
      },
      decimation: { enabled: true, algorithm: 'lttb', samples: 5000, threshold: 1000 },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          // ✅ Force date + time on all labels
          displayFormats: {
            minute: 'MMM d, HH:mm',
            hour: 'MMM d, HH:mm',
            day: 'MMM d, HH:mm',
            month: 'MMM d, HH:mm',
            year: 'MMM d, HH:mm',
          },
          tooltipFormat: 'MMM d, HH:mm',
        },
        grid: { display: showGrid },
        ticks: {
          maxRotation: 30,
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
      y: {
        grid: { display: showGrid },
        ticks: { callback: (v) => v?.toFixed(1) },
      },
    },
  };

  const handleResetZoom = () => chartRef.current?.resetZoom();
  const handleDownload = () => {
    if (!chartRef.current) return;
    const link = document.createElement('a');
    link.download = `chart_${new Date().toISOString().slice(0,10)}.png`;
    link.href = chartRef.current.canvas.toDataURL('image/png');
    link.click();
  };
  const handleFullscreen = () => setIsFullscreen((p) => !p);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading chart...</Typography>
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
      <Box display="flex" justifyContent="center" alignItems="center" height={height} bgcolor="#f5f5f5" borderRadius={2}>
        <Typography variant="body2" color="text.secondary">No signals selected</Typography>
      </Box>
    );
  }

  if (!hasData) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={height} bgcolor="#f5f5f5" borderRadius={2} gap={1}>
        <Typography variant="body2" color="text.secondary">No data available for the selected time range.</Typography>
        <Typography variant="caption" color="text.secondary">Raw data is limited to the last 2 days.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: isFullscreen ? 'calc(100vh - 64px)' : height, width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" px={1} py={0.5} bgcolor="#f5f5f5" borderRadius="4px 4px 0 0" flexWrap="wrap">
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {timeLevel === 'raw' ? 'Real-time (1Hz)' : timeLevel === 'minute' ? '1-Minute Avg' : '1-Hour Avg'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {startTime?.toLocaleString()} → {endTime?.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {signals.filter(s => signalData[s.signal_id]?.length > 0).length} signals
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <FormControlLabel control={<Switch size="small" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} />} label="Legend" />
          <FormControlLabel control={<Switch size="small" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />} label="Grid" />
          <Tooltip title="Reset Zoom"><IconButton size="small" onClick={handleResetZoom}><ResetIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Download"><IconButton size="small" onClick={handleDownload}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Fullscreen"><IconButton size="small" onClick={handleFullscreen}>{isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}</IconButton></Tooltip>
        </Stack>
      </Box>
      <Box sx={{ height: `calc(100% - 36px)`, bgcolor: 'white', border: '1px solid #e0e0e0', borderTop: 'none' }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </Box>
    </Box>
  );
};

export default TrendChart;
/**
 * DataTimeline Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/DataTimeline.jsx
 * Description: Data availability timeline with swipeable start/end markers
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Slider,
  Tooltip,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const TimelineContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  padding: theme.spacing(2, 0),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

const TimelineBar = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 48,
  backgroundColor: theme.palette.grey[100],
  borderRadius: 4,
  overflow: 'hidden',
  cursor: 'pointer',
}));

const DataBlock = styled(Box)(({ theme, color = 'success', opacity = 1 }) => ({
  position: 'absolute',
  top: 4,
  height: 40,
  borderRadius: 3,
  backgroundColor: color === 'success' 
    ? theme.palette.success.main 
    : color === 'warning' 
      ? theme.palette.warning.main 
      : theme.palette.grey[300],
  opacity: opacity,
  transition: 'all 0.2s ease',
  '&:hover': {
    opacity: 0.8,
    transform: 'scaleY(1.05)',
  },
}));

const Marker = styled(Box)(({ theme, position = 'start' }) => ({
  position: 'absolute',
  top: -4,
  [position === 'start' ? 'left' : 'right']: 0,
  width: 4,
  height: 56,
  backgroundColor: theme.palette.primary.main,
  cursor: 'col-resize',
  zIndex: 10,
  borderRadius: 2,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -8,
    [position === 'start' ? 'left' : 'right']: -4,
    width: 12,
    height: 12,
    backgroundColor: theme.palette.primary.main,
    borderRadius: '50%',
    cursor: 'grab',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    [position === 'start' ? 'left' : 'right']: -4,
    width: 12,
    height: 12,
    backgroundColor: theme.palette.primary.main,
    borderRadius: '50%',
    cursor: 'grab',
  },
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    '&::before, &::after': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const Label = styled(Typography)(({ theme }) => ({
  fontSize: '0.65rem',
  color: theme.palette.text.secondary,
  position: 'absolute',
  top: -18,
  [theme.direction === 'rtl' ? 'right' : 'left']: 0,
  transform: 'translateX(-50%)',
  whiteSpace: 'nowrap',
}));

const DataTimeline = ({
  signalId,
  timeLevel = 'raw',
  intervals = [],
  loading = false,
  error = null,
  startTime,
  endTime,
  onRangeChange,
  onRefresh,
  height = 120,
}) => {
  const timelineRef = useRef(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [startPercent, setStartPercent] = useState(0);
  const [endPercent, setEndPercent] = useState(100);

  // Format date for display
  const formatDate = useCallback((date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Calculate colors based on data quality
  const getBlockColor = (dataCount, qualityRatio) => {
    if (dataCount === 0) return 'grey';
    if (qualityRatio >= 0.9) return 'success';
    if (qualityRatio >= 0.7) return 'warning';
    return 'error';
  };

  // Get block width for each interval
  const getBlockWidth = useCallback(() => {
    if (!intervals || intervals.length === 0) return 100;
    return 100 / intervals.length;
  }, [intervals]);

  // Handle drag start
  const handleStartMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDraggingStart(true);
  }, []);

  const handleEndMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDraggingEnd(true);
  }, []);

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!timelineRef.current) return;
      if (!isDraggingStart && !isDraggingEnd) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const percent = x * 100;

      if (isDraggingStart) {
        const newStart = Math.min(percent, endPercent - 5);
        setStartPercent(newStart);
        if (startTime && endTime) {
          const duration = endTime.getTime() - startTime.getTime();
          const newStartTime = new Date(startTime.getTime() + (duration * newStart) / 100);
          onRangeChange(newStartTime, endTime);
        }
      }

      if (isDraggingEnd) {
        const newEnd = Math.max(percent, startPercent + 5);
        setEndPercent(newEnd);
        if (startTime && endTime) {
          const duration = endTime.getTime() - startTime.getTime();
          const newEndTime = new Date(startTime.getTime() + (duration * newEnd) / 100);
          onRangeChange(startTime, newEndTime);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDraggingStart,
    isDraggingEnd,
    startPercent,
    endPercent,
    startTime,
    endTime,
    onRangeChange,
  ]);

  // Calculate display range
  const rangeStart = startPercent;
  const rangeEnd = endPercent;

  // Determine if we should show detailed view
  const showDetailed = intervals && intervals.length <= 100;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight="bold">
          Data Availability
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`${intervals?.length || 0} intervals`}
            size="small"
            color="info"
            variant="outlined"
          />
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Timeline */}
      <Box position="relative" ref={timelineRef}>
        <TimelineContainer sx={{ height }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress size={24} />
              <Typography variant="caption" sx={{ ml: 1 }}>
                Loading timeline...
              </Typography>
            </Box>
          ) : error ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            </Box>
          ) : !intervals || intervals.length === 0 ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <Typography variant="body2" color="text.secondary">
                No data available for this period
              </Typography>
            </Box>
          ) : (
            <TimelineBar>
              {/* Data Blocks */}
              {intervals.map((interval, index) => {
                const blockWidth = getBlockWidth();
                const left = index * blockWidth;
                const color = getBlockColor(
                  interval.data_count || 0,
                  interval.quality_ratio || 0
                );
                const opacity = interval.data_count > 0 ? 1 : 0.3;

                return (
                  <Tooltip
                    key={index}
                    title={
                      <Box>
                        <Typography variant="caption">
                          {formatDate(interval.timestamp)}
                        </Typography>
                        <br />
                        <Typography variant="caption">
                          Points: {interval.data_count || 0}
                        </Typography>
                        {interval.avg_value !== undefined && (
                          <>
                            <br />
                            <Typography variant="caption">
                              Avg: {interval.avg_value?.toFixed(2)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                    placement="top"
                  >
                    <DataBlock
                      color={color}
                      opacity={opacity}
                      sx={{
                        left: `${left}%`,
                        width: `${blockWidth}%`,
                      }}
                    />
                  </Tooltip>
                );
              })}

              {/* Range Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: `${rangeStart}%`,
                  width: `${rangeEnd - rangeStart}%`,
                  height: '100%',
                  backgroundColor: 'rgba(33, 150, 243, 0.15)',
                  borderLeft: '2px solid #2196F3',
                  borderRight: '2px solid #2196F3',
                  pointerEvents: 'none',
                  borderRadius: '4px',
                }}
              />

              {/* Start Marker */}
              <Marker
                position="start"
                onMouseDown={handleStartMouseDown}
                sx={{ left: `${rangeStart}%` }}
              >
                <Label sx={{ top: -20, transform: 'translateX(-50%)' }}>
                  {formatDate(startTime)}
                </Label>
              </Marker>

              {/* End Marker */}
              <Marker
                position="end"
                onMouseDown={handleEndMouseDown}
                sx={{ left: `${rangeEnd}%` }}
              >
                <Label sx={{ top: -20, transform: 'translateX(50%)' }}>
                  {formatDate(endTime)}
                </Label>
              </Marker>
            </TimelineBar>
          )}
        </TimelineContainer>
      </Box>

      {/* Legend */}
      <Box display="flex" justifyContent="center" gap={3} mt={1}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: 0.5 }} />
          <Typography variant="caption">Good Data</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'warning.main', borderRadius: 0.5 }} />
          <Typography variant="caption">Partial Data</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'error.main', borderRadius: 0.5 }} />
          <Typography variant="caption">Poor Quality</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'grey.300', borderRadius: 0.5 }} />
          <Typography variant="caption">No Data</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'rgba(33, 150, 243, 0.15)', border: '1px solid #2196F3', borderRadius: 0.5 }} />
          <Typography variant="caption">Selected Range</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default DataTimeline;
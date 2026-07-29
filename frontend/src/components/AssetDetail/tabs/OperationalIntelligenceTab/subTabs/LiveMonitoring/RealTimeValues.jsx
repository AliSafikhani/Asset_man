/**
 * RealTimeValues Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/RealTimeValues.jsx
 * Description: Display real-time (latest) values for selected signals with status indicators
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Skeleton,
  Badge,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  FiberManualRecord,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Pulse animation for live indicator
const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const LiveIndicator = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.25, 1),
  borderRadius: 12,
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  fontSize: '0.6rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  animation: `${pulse} 2s ease-in-out infinite`,
  '& .dot': {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: theme.palette.common.white,
  },
}));

const ValueCard = styled(Paper)(({ theme, status = 'normal' }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  borderLeft: `4px solid ${
    status === 'normal'
      ? theme.palette.success.main
      : status === 'warning'
        ? theme.palette.warning.main
        : status === 'critical'
          ? theme.palette.error.main
          : theme.palette.grey[400]
  }`,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  height: '100%',
  minHeight: 80,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
}));

const StatusBadge = styled(Badge)(({ theme, status = 'normal' }) => ({
  '& .MuiBadge-badge': {
    backgroundColor:
      status === 'normal'
        ? theme.palette.success.main
        : status === 'warning'
          ? theme.palette.warning.main
          : status === 'critical'
            ? theme.palette.error.main
            : theme.palette.grey[400],
    color: '#fff',
    fontSize: '0.5rem',
    height: 16,
    minWidth: 16,
    padding: '0 4px',
    borderRadius: 8,
  },
}));

const ValueChange = styled(Box)(({ theme, direction = 'up' }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  fontSize: '0.7rem',
  fontWeight: 500,
  color:
    direction === 'up'
      ? theme.palette.success.main
      : direction === 'down'
        ? theme.palette.error.main
        : theme.palette.text.secondary,
  '& svg': {
    fontSize: 14,
  },
}));

const RealTimeValues = ({
  signals = [],
  selectedSignalIds = [],
  latestValues = {},
  loading = false,
  error = null,
  onSignalClick,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 10000,
  maxDisplay = 20,
}) => {
  const [visibleSignals, setVisibleSignals] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  // Filter signals to show only selected ones
  useEffect(() => {
    const filtered = signals.filter(
      (s) => selectedSignalIds.includes(s.signal_id) || selectedSignalIds.length === 0
    );
    const sorted = filtered.slice(0, expanded ? filtered.length : maxDisplay);
    setVisibleSignals(sorted);
  }, [signals, selectedSignalIds, expanded, maxDisplay]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh && onRefresh) {
      intervalRef.current = setInterval(() => {
        onRefresh();
        setLastUpdated(new Date());
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Get signal status
  const getSignalStatus = useCallback((signal) => {
    const latest = latestValues[signal.signal_id];
    if (!latest) return 'unknown';

    // Check alarm status
    if (signal.alert_threshold_max !== null && latest.value > signal.alert_threshold_max) {
      return 'critical';
    }
    if (signal.alert_threshold_min !== null && latest.value < signal.alert_threshold_min) {
      return 'warning';
    }

    // Check quality
    if (latest.quality === false) return 'unknown';

    return 'normal';
  }, [latestValues]);

  // Get display name
  const getDisplayName = useCallback((signal) => {
    return signal.custom_name || signal.name || `Signal ${signal.signal_id}`;
  }, []);

  // Get unit
  const getUnit = useCallback((signal) => {
    return signal.custom_unit || signal.unit || '';
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'normal':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'warning':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'critical':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" color="disabled" />;
    }
  }, []);

  // Get status label
  const getStatusLabel = useCallback((status) => {
    switch (status) {
      case 'normal':
        return 'Normal';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
      default:
        return 'Unknown';
    }
  }, []);

  // Get value change direction
  const getChangeDirection = useCallback((signal) => {
    const latest = latestValues[signal.signal_id];
    if (!latest || latest.rate_of_change === undefined) return null;

    const rate = latest.rate_of_change;
    if (Math.abs(rate) < 0.01) return 'flat';
    return rate > 0 ? 'up' : 'down';
  }, [latestValues]);

  // Get change label
  const getChangeLabel = useCallback((signal) => {
    const latest = latestValues[signal.signal_id];
    if (!latest || latest.rate_of_change === undefined) return '—';

    const rate = latest.rate_of_change;
    const absRate = Math.abs(rate);
    if (absRate < 0.01) return '0.0';

    return `${rate > 0 ? '+' : ''}${absRate.toFixed(2)}`;
  }, [latestValues]);

  // Get color
  const getColor = useCallback((signal) => {
    return signal.color_hex || '#2196F3';
  }, []);

  // Render value card for a signal
  const renderValueCard = (signal) => {
    const latest = latestValues[signal.signal_id];
    const status = getSignalStatus(signal);
    const displayName = getDisplayName(signal);
    const unit = getUnit(signal);
    const color = getColor(signal);
    const changeDirection = getChangeDirection(signal);
    const changeLabel = getChangeLabel(signal);

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={signal.signal_id}>
        <Zoom in={true} style={{ transitionDelay: '50ms' }}>
          <ValueCard
            status={status}
            onClick={() => onSignalClick && onSignalClick(signal.signal_id)}
            sx={{ cursor: onSignalClick ? 'pointer' : 'default' }}
          >
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '70%',
                }}
              >
                {displayName}
              </Typography>
              {latest && (
                <Tooltip title={`Last updated: ${new Date(latest.timestamp).toLocaleString()}`}>
                  <Chip
                    label="Live"
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: '0.5rem',
                      backgroundColor: color,
                      color: '#fff',
                    }}
                  />
                </Tooltip>
              )}
            </Box>

            {/* Value */}
            <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  color: status === 'critical' ? 'error.main' : 'text.primary',
                }}
              >
                {latest && latest.value !== undefined
                  ? latest.value.toFixed(2)
                  : '—'}
              </Typography>
              {unit && (
                <Typography variant="caption" color="text.secondary">
                  {unit}
                </Typography>
              )}
            </Box>

            {/* Footer */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Badge
                  variant="dot"
                  color={
                    status === 'normal'
                      ? 'success'
                      : status === 'warning'
                        ? 'warning'
                        : status === 'critical'
                          ? 'error'
                          : 'default'
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  {getStatusLabel(status)}
                </Typography>
              </Box>

              {latest && latest.timestamp && (
                <ValueChange direction={changeDirection || 'flat'}>
                  {changeDirection === 'up' && <TrendingUpIcon />}
                  {changeDirection === 'down' && <TrendingDownIcon />}
                  {changeDirection === 'flat' && <TrendingFlatIcon />}
                  {changeLabel}
                </ValueChange>
              )}
            </Box>

            {/* Quality indicator */}
            {latest && latest.quality === false && (
              <Box mt={0.5}>
                <Chip
                  label="BAD QUALITY"
                  size="small"
                  color="error"
                  sx={{ height: 16, fontSize: '0.5rem' }}
                />
              </Box>
            )}
          </ValueCard>
        </Zoom>
      </Grid>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Box p={2}>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rounded" height={80} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error" action={
          onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          )
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  // No signals selected
  if (selectedSignalIds.length === 0) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          No signals selected. Select signals from the list to view real-time values.
        </Typography>
      </Box>
    );
  }

  // No data available
  if (visibleSignals.length === 0) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          No real-time data available for the selected signals.
        </Typography>
      </Box>
    );
  }

  // Total signals count
  const totalSignals = signals.filter(
    (s) => selectedSignalIds.includes(s.signal_id) || selectedSignalIds.length === 0
  ).length;

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle2" fontWeight="bold">
            Real-Time Values
          </Typography>
          <Chip
            label={`${visibleSignals.length} / ${totalSignals} signals`}
            size="small"
            variant="outlined"
          />
          {autoRefresh && (
            <LiveIndicator>
              <span className="dot" />
              Live
            </LiveIndicator>
          )}
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {totalSignals > maxDisplay && (
            <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
              <Chip
                label={expanded ? 'Show Less' : `Show All (${totalSignals})`}
                size="small"
                onClick={() => setExpanded(!expanded)}
                clickable
              />
            </Tooltip>
          )}
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={onRefresh}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Value Cards */}
      <Grid container spacing={2}>
        {visibleSignals.map(renderValueCard)}
      </Grid>
    </Box>
  );
};

export default RealTimeValues;
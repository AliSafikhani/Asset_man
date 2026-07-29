/**
 * SignalList Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/SignalList.jsx
 * Description: List of signals with checkboxes, colors, latest values, and status
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
  FiberManualRecord,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const StatusDot = styled(Box)(({ theme, status = 'normal', size = 8 }) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  backgroundColor:
    status === 'normal'
      ? theme.palette.success.main
      : status === 'warning'
        ? theme.palette.warning.main
        : status === 'critical'
          ? theme.palette.error.main
          : theme.palette.grey[400],
  display: 'inline-block',
  flexShrink: 0,
}));

const SignalListItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const SignalList = ({
  signals = [],
  selectedIds = new Set(),
  onToggle,
  onSelectAll,
  onDeselectAll,
  onSignalClick,
  latestValues = {},
  loading = false,
  showAssetName = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  // Filter signals by search term
  const filteredSignals = useMemo(() => {
    if (!searchTerm) return signals;
    const term = searchTerm.toLowerCase();
    return signals.filter(
      (s) =>
        (s.custom_name || s.name || '').toLowerCase().includes(term) ||
        (s.kks_code || '').toLowerCase().includes(term) ||
        (s.description || '').toLowerCase().includes(term)
    );
  }, [signals, searchTerm]);

  // Group signals by group_id
  const groupedSignals = useMemo(() => {
    const groups = {};
    const ungrouped = [];

    for (const signal of filteredSignals) {
      if (signal.group_id) {
        if (!groups[signal.group_id]) {
          groups[signal.group_id] = {
            group_id: signal.group_id,
            group_name: signal.group_name || `Group ${signal.group_id}`,
            signals: [],
          };
        }
        groups[signal.group_id].signals.push(signal);
      } else {
        ungrouped.push(signal);
      }
    }

    return { groups: Object.values(groups), ungrouped };
  }, [filteredSignals]);

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Get signal display name
  const getDisplayName = (signal) => {
    return signal.custom_name || signal.name || `Signal ${signal.signal_id}`;
  };

  // Get signal unit
  const getUnit = (signal) => {
    return signal.custom_unit || signal.unit || '';
  };

  // Get signal status
  const getSignalStatus = (signal) => {
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
  };

  // Get status icon
  const getStatusIcon = (status) => {
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
  };

  // Render a single signal item
  const renderSignalItem = (signal) => {
    const isSelected = selectedIds.has(signal.signal_id);
    const latest = latestValues[signal.signal_id];
    const status = getSignalStatus(signal);
    const displayName = getDisplayName(signal);
    const unit = getUnit(signal);
    const color = signal.color_hex || '#2196F3';

    return (
      <SignalListItem
        key={signal.signal_id}
        selected={isSelected}
        onClick={() => onSignalClick && onSignalClick(signal.signal_id)}
        dense
      >
        {/* Checkbox */}
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Checkbox
            edge="start"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggle(signal.signal_id);
            }}
            sx={{
              color: color,
              '&.Mui-checked': {
                color: color,
              },
            }}
          />
        </ListItemIcon>

        {/* Color indicator */}
        <Box
          sx={{
            width: 3,
            height: 28,
            backgroundColor: color,
            borderRadius: 2,
            mr: 1,
            flexShrink: 0,
          }}
        />

        {/* Signal info */}
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                {displayName}
              </Typography>
              {unit && (
                <Typography variant="caption" color="text.secondary">
                  ({unit})
                </Typography>
              )}
              {signal.asset_name && showAssetName && (
                <Chip
                  label={signal.asset_name}
                  size="small"
                  variant="outlined"
                  sx={{ height: 16, fontSize: '0.5rem' }}
                />
              )}
            </Box>
          }
          secondary={
            <Box display="flex" alignItems="center" gap={1}>
              {latest && (
                <>
                  <Typography variant="caption" fontWeight={500}>
                    {latest.value !== undefined ? latest.value.toFixed(2) : '—'}
                  </Typography>
                  <StatusDot status={status} size={6} />
                  <Typography variant="caption" color="text.secondary">
                    {latest.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : ''}
                  </Typography>
                  {latest.quality === false && (
                    <Chip
                      label="BAD"
                      size="small"
                      color="error"
                      sx={{ height: 14, fontSize: '0.5rem' }}
                    />
                  )}
                </>
              )}
            </Box>
          }
          primaryTypographyProps={{
            variant: 'body2',
            noWrap: true,
          }}
          secondaryTypographyProps={{
            variant: 'caption',
            noWrap: true,
          }}
        />

        {/* Secondary action - status icon */}
        <ListItemSecondaryAction>
          <Tooltip title={`Status: ${status}`}>
            <Box>{getStatusIcon(status)}</Box>
          </Tooltip>
        </ListItemSecondaryAction>
      </SignalListItem>
    );
  };

  // Render a group with its signals
  const renderGroup = (group) => {
    const isExpanded = expandedGroups[group.group_id] !== false;
    const groupSignals = group.signals;
    const allSelected = groupSignals.every((s) => selectedIds.has(s.signal_id));

    return (
      <Box key={group.group_id}>
        <ListItemButton onClick={() => toggleGroup(group.group_id)} dense>
          <ListItemIcon sx={{ minWidth: 36 }}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {group.group_name}
                </Typography>
                <Chip
                  label={`${groupSignals.length} signals`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 16, fontSize: '0.5rem' }}
                />
                {allSelected && (
                  <Chip
                    label="All Selected"
                    size="small"
                    color="success"
                    sx={{ height: 16, fontSize: '0.5rem' }}
                  />
                )}
              </Box>
            }
          />
        </ListItemButton>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2 }}>
            {groupSignals.map(renderSignalItem)}
          </Box>
        </Collapse>
        <Divider sx={{ my: 0.5 }} />
      </Box>
    );
  };

  // ============================================================
  // Render
  // ============================================================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <Typography variant="body2" color="text.secondary">
          Loading signals...
        </Typography>
      </Box>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          No signals available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search */}
      <TextField
        size="small"
        placeholder="Search signals..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1 }}
      />

      {/* Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" color="text.secondary">
          {selectedIds.size} of {signals.length} selected
        </Typography>
        <Box>
          <Tooltip title="Select All">
            <IconButton size="small" onClick={onSelectAll}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Deselect All">
            <IconButton size="small" onClick={onDeselectAll}>
              <VisibilityOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Signal List */}
      <List dense disablePadding sx={{ maxHeight: 500, overflowY: 'auto' }}>
        {groupedSignals.groups.map(renderGroup)}

        {/* Ungrouped signals */}
        {groupedSignals.ungrouped.length > 0 && (
          <Box>
            <ListItemButton disabled dense>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" color="text.secondary">
                    Ungrouped
                  </Typography>
                }
              />
            </ListItemButton>
            {groupedSignals.ungrouped.map(renderSignalItem)}
          </Box>
        )}
      </List>
    </Box>
  );
};

export default SignalList;
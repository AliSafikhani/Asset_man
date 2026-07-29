/**
 * SignalTable Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/SignalTable.jsx
 * Description: Table view of signals with checkbox, color picker, and line type dropdown
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  FiberManualRecord,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

const LINE_TYPES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dashdot', label: 'Dash Dot' },
];

const SignalTable = ({
  signals = [],
  selectedIds = new Set(),
  onToggle,
  onSelectAll,
  onDeselectAll,
  latestValues = {},
  onSignalClick,
  onUpdateConfig,
  timeLevel = 'raw',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(true);

  const filteredSignals = signals.filter(
    (s) =>
      (s.custom_name || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.kks_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = filteredSignals.length > 0 && filteredSignals.every((s) =>
    selectedIds.has(s.signal_id)
  );

  const handleColorChange = (signalId, color) => {
    if (onUpdateConfig) {
      onUpdateConfig(signalId, { color_hex: color });
    }
  };

  const handleLineTypeChange = (signalId, lineType) => {
    if (onUpdateConfig) {
      onUpdateConfig(signalId, { line_type: lineType });
    }
  };

  const getLatestValue = (signalId) => {
    const val = latestValues[signalId];
    return val ? val.value : null;
  };

  const getLatestTimestamp = (signalId) => {
    const val = latestValues[signalId];
    return val ? val.timestamp : null;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight="600" fontSize="0.75rem" color="text.secondary">
          SIGNALS
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title="Select All">
            <IconButton size="small" onClick={onSelectAll}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear All">
            <IconButton size="small" onClick={onDeselectAll}>
              <FiberManualRecord fontSize="small" sx={{ color: 'text.disabled' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search signals..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 1.5 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
          sx: { borderRadius: 1, bgcolor: 'action.hover' },
        }}
      />

      <Divider sx={{ mb: 1.5 }} />

      {/* Signal rows */}
      <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
        {filteredSignals.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            No signals found
          </Typography>
        ) : (
          filteredSignals.map((signal) => {
            const isSelected = selectedIds.has(signal.signal_id);
            const latestValue = getLatestValue(signal.signal_id);
            const latestTime = getLatestTimestamp(signal.signal_id);
            const color = signal.color_hex || '#2196F3';
            const lineType = signal.line_type || 'solid';
            const displayName = signal.custom_name || signal.name || `Signal ${signal.signal_id}`;

            return (
              <Box
                key={signal.signal_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1,
                  px: 0.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                  },
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => onSignalClick && onSignalClick(signal.signal_id)}
              >
                {/* Checkbox */}
                <Checkbox
                  size="small"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggle(signal.signal_id);
                  }}
                  sx={{ p: 0.5 }}
                />

                {/* Color dot */}
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                />

                {/* Signal name & value */}
                <Box flex={1} minWidth={0}>
                  <Typography
                    variant="body2"
                    fontWeight={isSelected ? 600 : 400}
                    noWrap
                    sx={{
                      fontSize: '0.75rem',
                      color: isSelected ? 'text.primary' : 'text.secondary',
                    }}
                  >
                    {displayName}
                  </Typography>
                  {latestValue !== null && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.65rem', display: 'block' }}
                    >
                      {latestValue.toFixed(2)} {signal.custom_unit || signal.unit || ''}
                    </Typography>
                  )}
                </Box>

                {/* Color picker (small) */}
                <Tooltip title="Change color">
                  <Box sx={{ flexShrink: 0 }}>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleColorChange(signal.signal_id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 22,
                        height: 22,
                        padding: 0,
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        background: 'none',
                      }}
                    />
                  </Box>
                </Tooltip>

                {/* Line type dropdown */}
                <Tooltip title="Line type">
                  <FormControl size="small" sx={{ minWidth: 70, flexShrink: 0 }}>
                    <Select
                      value={lineType}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleLineTypeChange(signal.signal_id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        borderRadius: 1,
                        '& .MuiSelect-select': { py: 0.3, px: 1 },
                      }}
                    >
                      {LINE_TYPES.map((option) => (
                        <MenuItem key={option.value} value={option.value} dense>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 20,
                                height: 2,
                                bgcolor: 'currentColor',
                                borderBottom:
                                  option.value === 'solid'
                                    ? 'none'
                                    : option.value === 'dashed'
                                    ? '1px dashed currentColor'
                                    : option.value === 'dotted'
                                    ? '1px dotted currentColor'
                                    : '1px dash-dot currentColor',
                              }}
                            />
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Tooltip>
              </Box>
            );
          })
        )}
      </Box>

      {/* Footer stats */}
      <Divider sx={{ my: 1.5 }} />
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {selectedIds.size} of {signals.length} selected
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {TIME_LEVELS.find(t => t.id === timeLevel)?.label || 'Real-time'}
        </Typography>
      </Box>
    </Box>
  );
};

// Re-import TIME_LEVELS (or pass as prop)
const TIME_LEVELS = [
  { id: 'raw', label: 'Real-time', description: '1 second interval', maxDays: 30, defaultHours: 24 },
  { id: 'minute', label: 'Minute', description: '1 minute aggregated', maxDays: 730, defaultHours: 168 },
  { id: 'hour', label: 'Hour', description: '1 hour aggregated', maxDays: 10950, defaultHours: 720 },
];

export default SignalTable;
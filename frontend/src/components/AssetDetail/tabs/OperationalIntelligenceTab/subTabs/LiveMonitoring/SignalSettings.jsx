/**
 * SignalSettings Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/SignalSettings.jsx
 * Description: Per-signal configuration panel for display settings and alarm thresholds
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Slider,
  InputAdornment,
  Grid,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Undo as UndoIcon,
  ColorLens as ColorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Color picker component
const ColorPicker = styled('input')(({ theme }) => ({
  width: 40,
  height: 40,
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  '&::-webkit-color-swatch-wrapper': {
    padding: 0,
  },
  '&::-webkit-color-swatch': {
    border: `2px solid ${theme.palette.divider}`,
    borderRadius: '50%',
  },
  '&:hover': {
    '&::-webkit-color-swatch': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

// Line type options
const LINE_TYPES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dashdot', label: 'Dash Dot' },
];

// Line width options
const LINE_WIDTHS = [1, 2, 3, 4, 5];

// Scale factor options
const SCALE_FACTORS = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 5.0];

// Y-axis side options
const Y_AXIS_SIDES = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const SignalSettings = ({
  signal,
  onUpdate,
  onClose,
  loading = false,
  readOnly = false,
}) => {
  // ============================================================
  // State
  // ============================================================
  const [formData, setFormData] = useState({
    custom_name: '',
    custom_unit: '',
    color_hex: '#2196F3',
    line_type: 'solid',
    line_width: 2,
    scale_factor: 1.0,
    y_axis_side: 'left',
    alert_threshold_min: null,
    alert_threshold_max: null,
    is_threshold_enabled: false,
    is_visible: true,
  });

  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // ============================================================
  // Effects
  // ============================================================
  useEffect(() => {
    if (signal) {
      const data = {
        custom_name: signal.custom_name || signal.name || '',
        custom_unit: signal.custom_unit || signal.unit || '',
        color_hex: signal.color_hex || '#2196F3',
        line_type: signal.line_type || 'solid',
        line_width: signal.line_width || 2,
        scale_factor: signal.scale_factor || 1.0,
        y_axis_side: signal.y_axis_side || 'left',
        alert_threshold_min: signal.alert_threshold_min !== undefined ? signal.alert_threshold_min : null,
        alert_threshold_max: signal.alert_threshold_max !== undefined ? signal.alert_threshold_max : null,
        is_threshold_enabled: signal.is_threshold_enabled || false,
        is_visible: signal.is_visible !== undefined ? signal.is_visible : true,
      };
      setFormData(data);
      setOriginalData(data);
      setHasChanges(false);
    }
  }, [signal]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      const isChanged = JSON.stringify(newData) !== JSON.stringify(originalData);
      setHasChanges(isChanged);
      return newData;
    });
  }, [originalData]);

  const handleSave = useCallback(async () => {
    if (!signal || !onUpdate) return;

    try {
      await onUpdate(signal.signal_id, formData);
      setOriginalData(formData);
      setHasChanges(false);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save settings',
        severity: 'error',
      });
    }
  }, [signal, formData, onUpdate]);

  const handleReset = useCallback(() => {
    if (originalData) {
      setFormData(originalData);
      setHasChanges(false);
    }
  }, [originalData]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // ============================================================
  // Render helpers
  // ============================================================
  const renderDisplaySettings = () => (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Display Settings
      </Typography>

      <Grid container spacing={2}>
        {/* Custom Name */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Custom Name"
            value={formData.custom_name}
            onChange={(e) => handleChange('custom_name', e.target.value)}
            fullWidth
            size="small"
            disabled={readOnly || loading}
            placeholder={signal?.name || 'Enter custom name'}
            helperText={signal?.name ? `Original: ${signal.name}` : ''}
          />
        </Grid>

        {/* Custom Unit */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Custom Unit"
            value={formData.custom_unit}
            onChange={(e) => handleChange('custom_unit', e.target.value)}
            fullWidth
            size="small"
            disabled={readOnly || loading}
            placeholder={signal?.unit || 'Enter custom unit'}
            helperText={signal?.unit ? `Original: ${signal.unit}` : ''}
          />
        </Grid>

        {/* Color */}
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Color
            </Typography>
            <ColorPicker
              type="color"
              value={formData.color_hex}
              onChange={(e) => handleChange('color_hex', e.target.value)}
              disabled={readOnly || loading}
            />
            <TextField
              value={formData.color_hex}
              onChange={(e) => handleChange('color_hex', e.target.value)}
              size="small"
              disabled={readOnly || loading}
              sx={{ width: 100 }}
            />
          </Box>
        </Grid>

        {/* Line Type */}
        <Grid item xs={12} md={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Line Type</InputLabel>
            <Select
              value={formData.line_type}
              onChange={(e) => handleChange('line_type', e.target.value)}
              disabled={readOnly || loading}
              label="Line Type"
            >
              {LINE_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 30,
                        height: 2,
                        backgroundColor: 'currentColor',
                        borderBottom: option.value === 'solid'
                          ? 'none'
                          : option.value === 'dashed'
                            ? '2px dashed currentColor'
                            : option.value === 'dotted'
                              ? '2px dotted currentColor'
                              : '2px dash-dot currentColor',
                      }}
                    />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Line Width */}
        <Grid item xs={12} md={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Line Width</InputLabel>
            <Select
              value={formData.line_width}
              onChange={(e) => handleChange('line_width', Number(e.target.value))}
              disabled={readOnly || loading}
              label="Line Width"
            >
              {LINE_WIDTHS.map((width) => (
                <MenuItem key={width} value={width}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 30,
                        height: width,
                        backgroundColor: 'currentColor',
                      }}
                    />
                    {width}px
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Scale Factor */}
        <Grid item xs={12} md={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Scale Factor</InputLabel>
            <Select
              value={formData.scale_factor}
              onChange={(e) => handleChange('scale_factor', Number(e.target.value))}
              disabled={readOnly || loading}
              label="Scale Factor"
            >
              {SCALE_FACTORS.map((factor) => (
                <MenuItem key={factor} value={factor}>
                  {factor}x
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Y-Axis Side */}
        <Grid item xs={12} md={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Y-Axis</InputLabel>
            <Select
              value={formData.y_axis_side}
              onChange={(e) => handleChange('y_axis_side', e.target.value)}
              disabled={readOnly || loading}
              label="Y-Axis"
            >
              {Y_AXIS_SIDES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Visibility */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_visible}
                onChange={(e) => handleChange('is_visible', e.target.checked)}
                disabled={readOnly || loading}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                {formData.is_visible ? (
                  <VisibilityIcon fontSize="small" color="primary" />
                ) : (
                  <VisibilityOffIcon fontSize="small" color="disabled" />
                )}
                <Typography variant="body2">
                  {formData.is_visible ? 'Visible' : 'Hidden'}
                </Typography>
              </Box>
            }
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAlarmSettings = () => (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Alarm Settings
      </Typography>

      <Grid container spacing={2}>
        {/* Enable Alarms */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_threshold_enabled}
                onChange={(e) => handleChange('is_threshold_enabled', e.target.checked)}
                disabled={readOnly || loading}
                color="warning"
              />
            }
            label={
              <Typography variant="body2">
                {formData.is_threshold_enabled ? 'Alarms Enabled' : 'Alarms Disabled'}
              </Typography>
            }
          />
        </Grid>

        {/* Min Threshold */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Min Threshold"
            type="number"
            value={formData.alert_threshold_min !== null ? formData.alert_threshold_min : ''}
            onChange={(e) =>
              handleChange(
                'alert_threshold_min',
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            fullWidth
            size="small"
            disabled={readOnly || loading || !formData.is_threshold_enabled}
            placeholder="No minimum"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {signal?.unit || ''}
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Max Threshold */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Max Threshold"
            type="number"
            value={formData.alert_threshold_max !== null ? formData.alert_threshold_max : ''}
            onChange={(e) =>
              handleChange(
                'alert_threshold_max',
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            fullWidth
            size="small"
            disabled={readOnly || loading || !formData.is_threshold_enabled}
            placeholder="No maximum"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {signal?.unit || ''}
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Info */}
        {formData.is_threshold_enabled && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
              {formData.alert_threshold_min !== null && formData.alert_threshold_max !== null
                ? `Alert triggers when value is < ${formData.alert_threshold_min} or > ${formData.alert_threshold_max}`
                : formData.alert_threshold_min !== null
                  ? `Alert triggers when value is < ${formData.alert_threshold_min}`
                  : formData.alert_threshold_max !== null
                    ? `Alert triggers when value is > ${formData.alert_threshold_max}`
                    : 'Set a threshold to enable alerts'}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  // ============================================================
  // Render
  // ============================================================
  if (!signal) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Select a signal to configure settings
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        pb={1}
        borderBottom="1px solid"
        borderColor="divider"
      >
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            Signal Settings
          </Typography>
          <Chip
            label={`ID: ${signal.signal_id}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={signal.kks_code || 'No KKS'}
            size="small"
            variant="outlined"
            color="info"
          />
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {hasChanges && (
            <Tooltip title="Reset changes">
              <IconButton size="small" onClick={handleReset} disabled={loading}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Save settings">
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges || loading || readOnly}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Tooltip>
          {onClose && (
            <Tooltip title="Close">
              <IconButton size="small" onClick={handleClose}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Signal Info */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          <strong>Original Name:</strong> {signal.name || '-'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Original Unit:</strong> {signal.unit || '-'}
        </Typography>
        {signal.asset_name && (
          <Typography variant="body2" color="text.secondary">
            <strong>Asset:</strong> {signal.asset_name}
          </Typography>
        )}
        {signal.group_name && (
          <Typography variant="body2" color="text.secondary">
            <strong>Group:</strong> {signal.group_name}
          </Typography>
        )}
      </Box>

      {/* Settings Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {renderDisplaySettings()}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {renderAlarmSettings()}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignalSettings;
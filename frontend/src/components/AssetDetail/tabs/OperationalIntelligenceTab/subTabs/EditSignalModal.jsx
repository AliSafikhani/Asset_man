import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Divider,
  Stack,
  Switch,
  IconButton,
} from '@mui/material';

import { Close as CloseIcon, Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';

// ---- Design tokens ----
// Shared with SignalConfiguration.jsx. Worth pulling into a single
// `theme/tokens.js` and importing in both places instead of duplicating —
// kept local here to keep this a drop-in single-file change.
const S = {
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  divider: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textFaint: '#94a3b8',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  green: '#10b981',
  greenDark: '#059669',
  greenBg: '#ecfdf5',
  neutralBg: '#f1f5f9',
  neutralText: '#475569',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    bgcolor: S.card,
    fontSize: '14px',
    '& fieldset': { borderColor: S.border },
    '&:hover fieldset': { borderColor: S.textFaint },
    '&.Mui-focused fieldset': { borderColor: S.green },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: S.green },
};

const EMPTY_STATE = { color_hex: '#10b981', custom_name: '', custom_unit: '', is_visible: true };

const EditSignalModal = ({ open, signal, onSave, onCancel, saving }) => {
  const [editData, setEditData] = useState(EMPTY_STATE);

  useEffect(() => {
    if (signal) {
      setEditData({
        color_hex: signal.color_hex || EMPTY_STATE.color_hex,
        custom_name: signal.custom_name || '',
        custom_unit: signal.custom_unit || '',
        is_visible: signal.is_visible ?? true,
      });
    }
  }, [signal]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      color_hex: editData.color_hex,
      custom_name: editData.custom_name,
      custom_unit: editData.custom_unit,
      is_visible: editData.is_visible,
    });
  };

  const isDirty = useMemo(() => {
    if (!signal) return false;
    return (
      editData.color_hex !== (signal.color_hex || EMPTY_STATE.color_hex) ||
      editData.custom_name !== (signal.custom_name || '') ||
      editData.custom_unit !== (signal.custom_unit || '') ||
      editData.is_visible !== (signal.is_visible ?? true)
    );
  }, [editData, signal]);

  if (!signal) return null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: S.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EditIcon sx={{ color: S.green, fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '18px', color: S.textPrimary }}>
            Edit Signal Configuration
          </Typography>
        </Stack>
        <IconButton onClick={onCancel} size="small" sx={{ color: S.textFaint, '&:hover': { bgcolor: S.neutralBg } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: S.divider }} />

      <DialogContent sx={{ pt: 3 }}>
        {/* ---- Signal identity strip ---- */}
        <Box sx={{ p: 2, mb: 3, bgcolor: S.bg, borderRadius: '10px' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography sx={{ fontSize: '13px', color: S.textFaint }}>ID: {signal.signal_id}</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: S.textPrimary }}>
              {signal.custom_name || signal.name}
            </Typography>
            <Typography sx={{ fontSize: '13px', color: S.textFaint }}>KKS: {signal.kks_code || 'N/A'}</Typography>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Custom Name"
              value={editData.custom_name}
              onChange={handleChange('custom_name')}
              placeholder={signal.name || 'Enter custom name'}
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Custom Unit"
              value={editData.custom_unit}
              onChange={handleChange('custom_unit')}
              placeholder={signal.unit || 'e.g., kV, A, °C'}
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                component="input"
                type="color"
                value={editData.color_hex}
                onChange={handleChange('color_hex')}
                sx={{
                  width: 52,
                  height: 52,
                  p: '3px',
                  border: `1px solid ${S.border}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&::-webkit-color-swatch': { borderRadius: '6px', border: 'none' },
                }}
              />
              <TextField fullWidth label="Hex Color" value={editData.color_hex} onChange={handleChange('color_hex')} InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Stack>
          </Grid>

          <Grid item xs={12} md={6} display="flex" alignItems="center">
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ width: '100%', height: 56, px: 2, border: `1px solid ${S.border}`, borderRadius: '8px', bgcolor: S.card }}
            >
              <Switch
                checked={editData.is_visible}
                onChange={handleChange('is_visible')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: S.green },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: S.green, opacity: 0.5 },
                }}
              />
              <Typography sx={{ fontSize: '14px', color: S.textPrimary, fontWeight: 500 }}>
                {editData.is_visible ? 'Visible' : 'Hidden'}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={onCancel}
          sx={{ borderRadius: '8px', textTransform: 'none', color: S.neutralText, bgcolor: S.neutralBg, px: 2.5, '&:hover': { bgcolor: S.border } }}
        >
          Cancel
        </Button>
        <Button
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving || !isDirty}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            px: 3,
            color: '#fff',
            background: `linear-gradient(135deg, ${S.green} 0%, ${S.greenDark} 100%)`,
            transition: 'all 0.2s',
            '&:hover': { boxShadow: '0 4px 12px rgba(16,185,129,0.4)' },
            '&.Mui-disabled': { background: S.neutralBg, color: S.textFaint },
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSignalModal;

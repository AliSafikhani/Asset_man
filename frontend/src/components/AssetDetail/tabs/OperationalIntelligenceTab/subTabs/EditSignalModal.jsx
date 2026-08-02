import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  IconButton,
} from '@mui/material';

// ✅ All icons from @mui/icons-material
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

const EditSignalModal = ({ open, signal, onSave, onCancel, saving }) => {
  const [editData, setEditData] = useState({
    color_hex: '#2196F3',
    custom_name: '',
    custom_unit: '',
    is_visible: true,
  });

  // Force 56px height for inputs
  useEffect(() => {
    const styleId = 'edit-signal-modal-overrides';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .MuiDialog-root .MuiInputBase-root {
          height: 56px !important;
          min-height: 56px !important;
        }
        .MuiDialog-root .MuiInputBase-input {
          padding: 16px 14px !important;
          height: auto !important;
        }
        .MuiDialog-root .MuiInputLabel-root {
          font-size: 0.9rem !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  useEffect(() => {
    if (signal) {
      setEditData({
        color_hex: signal.color_hex || '#2196F3',
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

  if (!signal) return null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 3,
          minWidth: { xs: '95vw', sm: 600, md: 800 },
          maxWidth: { xs: '98vw', sm: '90vw', md: '85vw' },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">Edit Signal Configuration</Typography>
        <IconButton onClick={onCancel} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ p: 3, mb: 4, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems="center">
            <Typography variant="body1" color="text.secondary">ID: {signal.signal_id}</Typography>
            <Typography variant="h6" fontWeight={600}>{signal.custom_name || signal.name}</Typography>
            <Typography variant="body1" color="text.secondary">KKS: {signal.kks_code || 'N/A'}</Typography>
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
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <input
                type="color"
                value={editData.color_hex}
                onChange={handleChange('color_hex')}
                style={{ width: 56, height: 56, padding: 2, border: '2px solid #ccc', borderRadius: 8, cursor: 'pointer' }}
              />
              <TextField
                fullWidth
                label="Hex Color"
                value={editData.color_hex}
                onChange={handleChange('color_hex')}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} display="flex" alignItems="center">
            <FormControlLabel
              control={<Switch checked={editData.is_visible} onChange={handleChange('is_visible')} size="medium" />}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  {editData.is_visible ? <CheckCircleIcon color="success" fontSize="small" /> : <CloseIcon color="disabled" fontSize="small" />}
                  <Typography variant="body1">{editData.is_visible ? 'Visible' : 'Hidden'}</Typography>
                </Stack>
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 2, textTransform: 'none', px: 4 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSignalModal;
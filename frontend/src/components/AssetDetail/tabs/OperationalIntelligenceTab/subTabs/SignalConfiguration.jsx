/**
 * Signal Configuration Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/SignalConfiguration.jsx
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  InputAdornment,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

import { 
  getPlantSignals, 
  updateSignalConfig, 
  assignSignalToAsset, 
  unassignSignal, 
  getPlantGroups 
} from '../../../../../api/monitoring';
import apiClient from '../../../../../api/client';

// ----------------------------------------------------------------------
// API helper
const getAssets = async (plantId) => {
  const response = await apiClient.get('/assets', { params: { plant_id: plantId } });
  return response.data;
};

// ----------------------------------------------------------------------
// Custom Hook
const useSignalConfig = (plantId) => {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState([]);
  const [assets, setAssets] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!plantId) return;
    setLoading(true);
    setError(null);
    try {
      const [signalsData, assetsData, groupsData] = await Promise.all([
        getPlantSignals(plantId, true),
        getAssets(plantId),
        getPlantGroups(plantId),
      ]);
      setSignals(signalsData?.signals || []);
      setAssets(assetsData?.items || []);
      setGroups(groupsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { signals, assets, groups, loading, error, refetch: fetchData };
};

// ----------------------------------------------------------------------
// Edit Modal Sub-Component
const EditSignalModal = ({
  open,
  signal,
  assets,
  groups,
  onSave,
  onCancel,
  saving,
}) => {
  const [editData, setEditData] = useState({
    asset_id: '',
    group_id: '',
    color_hex: '#2196F3',
    custom_name: '',
    custom_unit: '',
    is_visible: true,
  });

  useEffect(() => {
    if (signal) {
      setEditData({
        asset_id: signal.asset_id ?? '',
        group_id: signal.group_id ?? '',
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
    const payload = {
      ...editData,
      asset_id: editData.asset_id === '' ? null : Number(editData.asset_id),
      group_id: editData.group_id === '' ? null : Number(editData.group_id),
      is_visible: Boolean(editData.is_visible),
    };
    onSave(payload);
  };

  if (!signal) return null;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">
          Edit Signal Configuration
        </Typography>
        <IconButton onClick={onCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {/* Banner */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'action.hover',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            ID: {signal.signal_id}
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {signal.custom_name || signal.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            KKS: {signal.kks_code || 'N/A'}
          </Typography>
        </Box>

        {/* Inputs Grid */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Custom Name"
              value={editData.custom_name}
              onChange={handleChange('custom_name')}
              size="small"
              placeholder={signal.name}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Custom Unit"
              value={editData.custom_unit}
              onChange={handleChange('custom_unit')}
              size="small"
              placeholder={signal.unit || 'Unit'}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Asset</InputLabel>
              <Select value={editData.asset_id} onChange={handleChange('asset_id')} label="Asset">
                <MenuItem value="">Unassigned</MenuItem>
                {assets.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.asset_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Group</InputLabel>
              <Select value={editData.group_id} onChange={handleChange('group_id')} label="Group">
                <MenuItem value="">No Group</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.group_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <input
                type="color"
                value={editData.color_hex}
                onChange={handleChange('color_hex')}
                style={{
                  width: 40,
                  height: 40,
                  padding: 2,
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              <TextField
                size="small"
                label="Hex Color"
                value={editData.color_hex}
                onChange={handleChange('color_hex')}
                fullWidth
              />
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} display="flex" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={editData.is_visible}
                  onChange={handleChange('is_visible')}
                  size="small"
                />
              }
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {editData.is_visible ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <CancelIcon color="disabled" fontSize="small" />
                  )}
                  <Typography variant="body2">
                    {editData.is_visible ? 'Visible' : 'Hidden'}
                  </Typography>
                </Stack>
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ----------------------------------------------------------------------
// Main Component
const SignalConfiguration = ({ plantId }) => {
  const { signals, assets, groups, loading, error, refetch } = useSignalConfig(plantId);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingSignal, setEditingSignal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [assignDialog, setAssignDialog] = useState({ open: false, signalId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMessage = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleAssign = useCallback(
    async (signalId, selectedAssetId) => {
      if (!selectedAssetId) {
        showMessage('Please select an asset to assign.', 'warning');
        return;
      }
      try {
        await assignSignalToAsset(signalId, selectedAssetId, plantId);
        showMessage('Signal assigned successfully!');
        setAssignDialog({ open: false, signalId: null });
        refetch();
      } catch (err) {
        showMessage(err.message || 'Failed to assign signal', 'error');
      }
    },
    [plantId, refetch, showMessage]
  );

  const handleUnassign = useCallback(
    async (signalId) => {
      if (!window.confirm('Are you sure you want to unassign this signal?')) return;
      try {
        await unassignSignal(signalId, plantId);
        showMessage('Signal unassigned successfully!');
        refetch();
      } catch (err) {
        showMessage(err.message || 'Failed to unassign signal', 'error');
      }
    },
    [plantId, refetch, showMessage]
  );

  const handleUpdateConfig = useCallback(
    async (signalId, config) => {
      try {
        await updateSignalConfig(signalId, config, plantId);
        setEditingSignal(null);
        showMessage('Configuration updated successfully!');
        refetch();
      } catch (err) {
        showMessage(err.message || 'Failed to update configuration', 'error');
      } finally {
        setSaving(false);
      }
    },
    [plantId, refetch, showMessage]
  );

  const saveEditing = useCallback(
    async (payload) => {
      if (!editingSignal) return;
      setSaving(true);
      await handleUpdateConfig(editingSignal.signal_id, payload);
    },
    [editingSignal, handleUpdateConfig]
  );

  const filteredSignals = useMemo(() => {
    if (!searchTerm) return signals;
    const term = searchTerm.toLowerCase();
    return signals.filter(
      (s) =>
        (s.custom_name || s.name || '').toLowerCase().includes(term) ||
        (s.kks_code || '').toLowerCase().includes(term)
    );
  }, [signals, searchTerm]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress size={32} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading configuration...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert
          severity="error"
          action={
            <Button size="small" color="inherit" onClick={refetch}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
      {/* Header Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justify: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            Signal Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {signals.length} signals · {assets.length} assets · {groups.length} groups
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={refetch}
              disabled={loading}
              sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' } }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
            }}
          >
            Add Group
          </Button>
        </Stack>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Search signals by name or KKS code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: 'background.paper' },
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size="medium">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Signal</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Group</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Visible
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSignals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No signals found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSignals.map((signal) => (
                <TableRow key={signal.signal_id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {signal.custom_name || signal.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {signal.kks_code}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{signal.custom_unit || signal.unit || '-'}</TableCell>
                  <TableCell>
                    {signal.asset_name ? (
                      <Chip label={signal.asset_name} size="small" color="primary" variant="outlined" />
                    ) : (
                      <Chip label="Unassigned" size="small" variant="outlined" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    {signal.group_name || <Chip label="No Group" size="small" variant="outlined" />}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: signal.color_hex || '#2196F3',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {signal.is_visible ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="disabled" fontSize="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditingSignal(signal)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {signal.is_assigned ? (
                      <Tooltip title="Unassign">
                        <IconButton size="small" color="error" onClick={() => handleUnassign(signal.signal_id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Assign to asset">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setAssignDialog({ open: true, signalId: signal.signal_id })}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <EditSignalModal
        open={!!editingSignal}
        signal={editingSignal}
        assets={assets}
        groups={groups}
        onSave={saveEditing}
        onCancel={() => setEditingSignal(null)}
        saving={saving}
      />

      {/* Assign Dialog */}
      <Dialog
        open={assignDialog.open}
        onClose={() => setAssignDialog({ open: false, signalId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Signal to Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Select an asset to assign this signal to:
            </Typography>
            {assets.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 1 }}>
                No assets available in this plant.
              </Alert>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {assets.map((a) => (
                  <Button
                    key={a.id}
                    variant="outlined"
                    fullWidth
                    onClick={() => handleAssign(assignDialog.signalId, a.id)}
                    sx={{ justifyContent: 'space-between', py: 1.5, textTransform: 'none' }}
                  >
                    <span>{a.asset_name}</span>
                    <Chip label={a.asset_type || 'Asset'} size="small" variant="outlined" />
                  </Button>
                ))}
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog({ open: false, signalId: null })}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignalConfiguration;
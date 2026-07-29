/**
 * Signal Configuration Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/SignalConfiguration.jsx
 * Description: Assign/unassign signals to assets, set groups, colors, etc.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/icons-material';

// Import API functions
import {
  getPlantSignals,
  updateSignalConfig,
  assignSignalToAsset,
  unassignSignal,
  getPlantGroups,
} from '../../../../../api/monitoring';

// Import assets API
import apiClient from '../../../../../api/client';

// Helper: get assets for a plant
const getAssets = async (plantId) => {
  const response = await apiClient.get('/assets', { params: { plant_id: plantId } });
  return response.data;
};

const SignalConfiguration = ({ asset, assetId, plantId }) => {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState([]);
  const [assets, setAssets] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [assignDialog, setAssignDialog] = useState({ open: false, signalId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!plantId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Get all signals for the plant
      const signalsData = await getPlantSignals(plantId, true);
      setSignals(signalsData?.signals || []);

      // 2. Get assets for this plant
      const assetsData = await getAssets(plantId);
      setAssets(assetsData?.items || []);

      // 3. Get groups for this plant
      const groupsData = await getPlantGroups(plantId);
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

  // Show snackbar message
  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handler: assign signal to asset
  const handleAssign = async (signalId, assetId) => {
    if (!assetId) {
      showMessage('Please select an asset to assign to.', 'warning');
      return;
    }
    
    try {
      await assignSignalToAsset(signalId, assetId, plantId);
      showMessage('Signal assigned successfully!');
      setAssignDialog({ open: false, signalId: null });
      fetchData();
    } catch (err) {
      showMessage(err.message || 'Failed to assign signal', 'error');
    }
  };

  // Handler: unassign signal
  const handleUnassign = async (signalId) => {
    if (!window.confirm('Are you sure you want to unassign this signal?')) return;
    
    try {
      await unassignSignal(signalId, plantId);
      showMessage('Signal unassigned successfully!');
      fetchData();
    } catch (err) {
      showMessage(err.message || 'Failed to unassign signal', 'error');
    }
  };

  // Handler: update signal configuration
  const handleUpdateConfig = async (signalId, config) => {
    try {
      await updateSignalConfig(signalId, config, plantId);
      setEditingId(null);
      showMessage('Configuration updated successfully!');
      fetchData();
    } catch (err) {
      showMessage(err.message || 'Failed to update configuration', 'error');
    }
  };

  // Start editing a row
  const startEditing = (signal) => {
    setEditingId(signal.signal_id);
    setEditData({
      asset_id: signal.asset_id || '',
      group_id: signal.group_id || '',
      color_hex: signal.color_hex || '#2196F3',
      custom_name: signal.custom_name || '',
      custom_unit: signal.custom_unit || '',
      is_visible: signal.is_visible !== undefined ? signal.is_visible : true,
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  // Save edited row
  const saveEditing = async (signalId) => {
    setSaving(true);
    await handleUpdateConfig(signalId, editData);
    setSaving(false);
  };

  // Open assign dialog
  const openAssignDialog = (signalId) => {
    setAssignDialog({ open: true, signalId });
  };

  // Close assign dialog
  const closeAssignDialog = () => {
    setAssignDialog({ open: false, signalId: null });
  };

  // Get asset name by ID
  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    return asset ? asset.asset_name : 'Unknown';
  };

  // Get group name by ID
  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.group_name : 'No Group';
  };

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading configuration...
        </Typography>
      </Box>
    );
  }

  // Render error
  if (error) {
    return (
      <Box p={2}>
        <Alert 
          severity="error" 
          action={
            <Button size="small" color="inherit" onClick={fetchData}>
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
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Signal Configuration
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={`${signals.length} signals`}
            size="small"
            color="info"
            variant="outlined"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Signal Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Signal Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Group</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Visible</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {signals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No signals found for this plant.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              signals.map((signal) => {
                const isEditing = editingId === signal.signal_id;
                return (
                  <TableRow key={signal.signal_id} hover>
                    <TableCell>{signal.signal_id}</TableCell>
                    
                    {/* Name */}
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editData.custom_name}
                          onChange={(e) => setEditData({ ...editData, custom_name: e.target.value })}
                          placeholder={signal.name}
                          sx={{ width: 150 }}
                        />
                      ) : (
                        <Box>
                          <Typography variant="body2">
                            {signal.custom_name || signal.name}
                          </Typography>
                          {signal.custom_name && (
                            <Typography variant="caption" color="text.secondary">
                              Original: {signal.name}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>

                    {/* Unit */}
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editData.custom_unit}
                          onChange={(e) => setEditData({ ...editData, custom_unit: e.target.value })}
                          placeholder={signal.unit || ''}
                          sx={{ width: 80 }}
                        />
                      ) : (
                        signal.custom_unit || signal.unit || '-'
                      )}
                    </TableCell>

                    {/* Asset */}
                    <TableCell>
                      {isEditing ? (
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={editData.asset_id}
                            onChange={(e) => setEditData({ ...editData, asset_id: e.target.value })}
                            displayEmpty
                          >
                            <MenuItem value="">Unassigned</MenuItem>
                            {assets.map((a) => (
                              <MenuItem key={a.id} value={a.id}>{a.asset_name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        signal.asset_name ? (
                          <Chip
                            label={signal.asset_name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="Unassigned"
                            size="small"
                            variant="outlined"
                            color="warning"
                          />
                        )
                      )}
                    </TableCell>

                    {/* Group */}
                    <TableCell>
                      {isEditing ? (
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={editData.group_id}
                            onChange={(e) => setEditData({ ...editData, group_id: e.target.value })}
                            displayEmpty
                          >
                            <MenuItem value="">No Group</MenuItem>
                            {groups.map((g) => (
                              <MenuItem key={g.id} value={g.id}>{g.group_name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        signal.group_name || (
                          <Chip
                            label="No Group"
                            size="small"
                            variant="outlined"
                          />
                        )
                      )}
                    </TableCell>

                    {/* Color */}
                    <TableCell>
                      {isEditing ? (
                        <input
                          type="color"
                          value={editData.color_hex}
                          onChange={(e) => setEditData({ ...editData, color_hex: e.target.value })}
                          style={{
                            width: 36,
                            height: 36,
                            padding: 2,
                            border: '2px solid #ddd',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            background: 'none',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            backgroundColor: signal.color_hex || '#2196F3',
                            borderRadius: '50%',
                            border: '2px solid #e0e0e0',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Visibility */}
                    <TableCell>
                      {isEditing ? (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editData.is_visible}
                              onChange={(e) => setEditData({ ...editData, is_visible: e.target.checked })}
                              size="small"
                            />
                          }
                          label=""
                        />
                      ) : (
                        signal.is_visible ? (
                          <Tooltip title="Visible">
                            <CheckCircleIcon color="success" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Hidden">
                            <CancelIcon color="disabled" fontSize="small" />
                          </Tooltip>
                        )
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      {isEditing ? (
                        <>
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => saveEditing(signal.signal_id)}
                              disabled={saving}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton size="small" onClick={cancelEditing}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit Settings">
                            <IconButton size="small" onClick={() => startEditing(signal)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {signal.is_assigned ? (
                            <Tooltip title="Unassign from asset">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleUnassign(signal.signal_id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Assign to asset">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openAssignDialog(signal.signal_id)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Tips */}
      <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1}>
        <Typography variant="caption" color="text.secondary">
          <strong>💡 Tips:</strong><br/>
          • Click <strong>Edit</strong> <EditIcon fontSize="inherit" sx={{ fontSize: 14 }} /> to change display name, unit, color, group, or visibility.<br/>
          • Click <strong>Assign</strong> <AddIcon fontSize="inherit" sx={{ fontSize: 14 }} /> to assign a signal to an asset.<br/>
          • Click <strong>Unassign</strong> <DeleteIcon fontSize="inherit" sx={{ fontSize: 14 }} /> to remove signal from its asset.<br/>
          • Changes are saved immediately when you click the <strong>Save</strong> button.
        </Typography>
      </Box>

      {/* Assign Dialog */}
      <Dialog open={assignDialog.open} onClose={closeAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Signal to Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Select an asset to assign this signal to:
            </Typography>
            {assets.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 1 }}>
                No assets available in this plant. Please create an asset first.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {assets.map((a) => (
                  <Button
                    key={a.id}
                    variant="outlined"
                    fullWidth
                    onClick={() => handleAssign(assignDialog.signalId, a.id)}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    {a.asset_name}
                    <Chip
                      label={a.asset_type || 'Asset'}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssignDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
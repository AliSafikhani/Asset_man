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
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Card,
  CardContent,
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
  Search as SearchIcon,
  Clear as ClearIcon,
  Devices as DevicesIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

import { getPlantSignals, updateSignalConfig, assignSignalToAsset, unassignSignal, getPlantGroups, createGroup } from '../../../../../api/monitoring';
import apiClient from '../../../../../api/client';
import EditSignalModal from './EditSignalModal';

// ---- API helper ----
const getAssets = async (plantId) => {
  const response = await apiClient.get('/assets', { params: { plant_id: plantId } });
  return response.data;
};

// ---- Custom Hook ----
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

// ---- Main Component ----
const SignalConfiguration = ({ plantId }) => {
  if (!plantId) {
    return (
      <Box p={3}>
        <Alert severity="warning" variant="filled" sx={{ borderRadius: 2 }}>
          No plant ID provided – cannot load signals.
        </Alert>
      </Box>
    );
  }

  const { signals, assets, groups, loading, error, refetch } = useSignalConfig(plantId);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSignal, setEditingSignal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [assignDialog, setAssignDialog] = useState({ open: false, signalId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const showMessage = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleAssign = useCallback(async (signalId, selectedAssetId) => {
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
  }, [plantId, refetch, showMessage]);

  const handleUnassign = useCallback(async (signalId) => {
    if (!window.confirm('Are you sure you want to unassign this signal?')) return;
    try {
      await unassignSignal(signalId, plantId);
      showMessage('Signal unassigned successfully!');
      refetch();
    } catch (err) {
      showMessage(err.message || 'Failed to unassign signal', 'error');
    }
  }, [plantId, refetch, showMessage]);

  const handleUpdateConfig = useCallback(async (signalId, config) => {
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
  }, [plantId, refetch, showMessage]);

  const saveEditing = useCallback(async (payload) => {
    if (!editingSignal) return;
    setSaving(true);
    await handleUpdateConfig(editingSignal.signal_id, payload);
  }, [editingSignal, handleUpdateConfig]);

  const handleCreateGroup = useCallback(async () => {
    if (!newGroupName.trim()) {
      showMessage('Please enter a group name.', 'warning');
      return;
    }
    setCreatingGroup(true);
    try {
      await createGroup({ plant_id: plantId, group_name: newGroupName.trim() });
      showMessage('Group created successfully!');
      setGroupDialogOpen(false);
      setNewGroupName('');
      refetch();
    } catch (err) {
      showMessage(err.message || 'Failed to create group', 'error');
    } finally {
      setCreatingGroup(false);
    }
  }, [plantId, newGroupName, refetch, showMessage]);

  const filteredSignals = useMemo(() => {
    if (!searchTerm) return signals;
    const term = searchTerm.toLowerCase();
    return signals.filter(s =>
      (s.custom_name || s.name || '').toLowerCase().includes(term) ||
      (s.kks_code || '').toLowerCase().includes(term)
    );
  }, [signals, searchTerm]);

  const handleClearSearch = () => setSearchTerm('');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={40} sx={{ color: '#667eea' }} />
        <Typography variant="body1" sx={{ ml: 2, color: '#475569' }}>Loading configuration...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" variant="filled" action={<Button size="small" color="inherit" onClick={refetch}>Retry</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* ---- Header Card ---- */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#fff',
          mb: 4,
          boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={2}>
            <Box>
              <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em">
                Signal Configuration
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                Manage signal metadata, display settings, and grouping
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={<DevicesIcon />}
                label={`${signals.length} Signals`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 500 }}
              />
              <Chip
                icon={<CategoryIcon />}
                label={`${groups.length} Groups`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 500 }}
              />
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={refetch}
                  disabled={loading}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* ---- Toolbar ---- */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name or KKS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}><ClearIcon fontSize="small" /></IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#f8fafc' },
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setGroupDialogOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Add Group
          </Button>
        </Stack>
      </Paper>

      {/* ---- Table Card ---- */}
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }}>Signal</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }}>Asset</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }}>Group</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }}>Color</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }} align="center">Visible</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSignals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">No signals found matching your search.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSignals.map((signal, index) => (
                  <TableRow
                    key={signal.signal_id}
                    hover
                    sx={{
                      bgcolor: index % 2 === 0 ? '#fff' : '#fafafa',
                      '&:hover': { bgcolor: '#f1f5f9' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500} color="#0f172a">
                          {signal.custom_name || signal.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{signal.kks_code}</Typography>
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
                      {signal.group_name ? (
                        <Chip label={signal.group_name} size="small" variant="outlined" />
                      ) : (
                        <Chip label="No Group" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          backgroundColor: signal.color_hex || '#2196F3',
                          borderRadius: '50%',
                          border: '2px solid #e2e8f0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
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
                        <IconButton size="small" onClick={() => setEditingSignal(signal)} sx={{ color: '#4f46e5' }}>
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
                          <IconButton size="small" color="primary" onClick={() => setAssignDialog({ open: true, signalId: signal.signal_id })}>
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
      </Card>

      {/* ---- Dialogs ---- */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle><Typography variant="h6" fontWeight="bold">Create New Group</Typography></DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="e.g., Voltage, Temperature, Vibration"
            onKeyPress={(e) => { if (e.key === 'Enter') handleCreateGroup(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGroupDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained" disabled={creatingGroup || !newGroupName.trim()} startIcon={<SaveIcon />} sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
            {creatingGroup ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>

      <EditSignalModal
        open={!!editingSignal}
        signal={editingSignal}
        onSave={saveEditing}
        onCancel={() => setEditingSignal(null)}
        saving={saving}
      />

      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, signalId: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle>Assign Signal to Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>Select an asset to assign this signal to:</Typography>
            {assets.length === 0 ? <Alert severity="warning" sx={{ mt: 1 }}>No assets available in this plant.</Alert> : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {assets.map(a => (
                  <Button key={a.id} variant="outlined" fullWidth onClick={() => handleAssign(assignDialog.signalId, a.id)} sx={{ justifyContent: 'space-between', py: 1.5, textTransform: 'none' }}>
                    <span>{a.asset_name}</span>
                    <Chip label={a.asset_type || 'Asset'} size="small" variant="outlined" />
                  </Button>
                ))}
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setAssignDialog({ open: false, signalId: null })}>Cancel</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignalConfiguration;
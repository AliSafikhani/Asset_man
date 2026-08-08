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
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Stack,
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
  SsidChart as SsidChartIcon,
  Devices as DevicesIcon,
  Category as CategoryIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

import { getPlantSignals, updateSignalConfig, assignSignalToAsset, unassignSignal, getPlantGroups, createGroup } from '../../../../../api/monitoring';
import apiClient from '../../../../../api/client';
import EditSignalModal from './EditSignalModal';

// ---- Design tokens ----
// Light "admin dashboard" language: white cards on a pale slate background,
// soft box-shadows instead of borders, a green gradient for the primary
// action, and small pastel badges per status. Matches Plants.jsx.
const S = {
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  divider: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textFaint: '#94a3b8',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.08)',
  green: '#10b981',
  greenDark: '#059669',
  greenBg: '#ecfdf5',
  indigo: '#4f46e5',
  indigoBg: '#eef2ff',
  amber: '#d97706',
  amberBg: '#fffbeb',
  red: '#dc2626',
  redBg: '#fef2f2',
  neutralBg: '#f1f5f9',
  neutralText: '#475569',
};

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

// ---- Small building blocks ----
const Badge = ({ label, tone = 'neutral' }) => {
  const tones = {
    neutral: { bg: S.neutralBg, c: S.neutralText },
    indigo: { bg: S.indigoBg, c: S.indigo },
    amber: { bg: S.amberBg, c: S.amber },
    red: { bg: S.redBg, c: S.red },
    green: { bg: S.greenBg, c: S.greenDark },
  }[tone];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.25,
        py: 0.5,
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: tones.c,
        bgcolor: tones.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  );
};

const StatCard = ({ icon, iconBg, value, label }) => (
  <Box
    sx={{
      bgcolor: S.card,
      borderRadius: '12px',
      p: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      boxShadow: S.shadow,
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': { boxShadow: S.shadowHover, transform: 'translateY(-2px)' },
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '10px',
        bgcolor: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '24px', fontWeight: 700, color: S.textPrimary, lineHeight: 1.2 }}>{value}</Typography>
      <Typography sx={{ fontSize: '13px', color: S.textFaint }}>{label}</Typography>
    </Box>
  </Box>
);

// ---- Main Component ----
const SignalConfiguration = ({ plantId }) => {
  if (!plantId) {
    return (
      <Box sx={{ p: 3, bgcolor: S.bg, minHeight: '100vh' }}>
        <Alert severity="warning" sx={{ borderRadius: '10px' }}>
          No plant ID provided — cannot load signals.
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

  const assignedCount = useMemo(() => signals.filter(s => s.is_assigned).length, [signals]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400} sx={{ bgcolor: S.bg }}>
        <CircularProgress size={36} sx={{ color: S.green }} />
        <Typography variant="body1" sx={{ ml: 2, color: S.textSecondary }}>Loading configuration...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} sx={{ bgcolor: S.bg, minHeight: '100vh' }}>
        <Alert severity="error" sx={{ borderRadius: '10px' }} action={<Button size="small" color="inherit" onClick={refetch}>Retry</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto', bgcolor: S.bg, minHeight: '100vh' }}>

      {/* ---- Header ---- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: S.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SsidChartIcon sx={{ color: S.green, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '28px', fontWeight: 700, color: S.textPrimary, lineHeight: 1.2 }}>
              Signal Configuration
            </Typography>
            <Typography sx={{ fontSize: '14px', color: S.textSecondary, mt: 0.25 }}>
              Manage signal metadata, display settings, and grouping
            </Typography>
          </Box>
        </Stack>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setGroupDialogOpen(true)}
          sx={{
            px: 3,
            py: 1.25,
            background: `linear-gradient(135deg, ${S.green} 0%, ${S.greenDark} 100%)`,
            color: '#fff',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: 'none',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' },
          }}
        >
          Add Group
        </Button>
      </Stack>

      {/* ---- Stat cards ---- */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard icon={<DevicesIcon sx={{ color: S.green }} />} iconBg={S.greenBg} value={signals.length} label="Total Signals" />
        <StatCard icon={<CategoryIcon sx={{ color: S.indigo }} />} iconBg={S.indigoBg} value={groups.length} label="Groups" />
        <StatCard icon={<TimelineIcon sx={{ color: S.amber }} />} iconBg={S.amberBg} value={assignedCount} label="Assigned" />
      </Box>

      {/* ---- Search + refresh ---- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1, minWidth: 250, display: 'flex', alignItems: 'center', bgcolor: S.card, borderRadius: '10px', px: 2, boxShadow: S.shadow }}>
          <SearchIcon sx={{ color: S.textFaint, mr: 1.5, fontSize: 20 }} />
          <TextField
            variant="standard"
            placeholder="Search by name or KKS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputProps={{ disableUnderline: true, sx: { fontSize: '14px', py: 1.5 } }}
          />
          {searchTerm && (
            <IconButton size="small" onClick={handleClearSearch}>
              <ClearIcon sx={{ fontSize: 16, color: S.textFaint }} />
            </IconButton>
          )}
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={refetch}
            disabled={loading}
            sx={{ bgcolor: S.card, borderRadius: '10px', boxShadow: S.shadow, width: 44, height: 44, '&:hover': { bgcolor: S.divider } }}
          >
            <RefreshIcon sx={{ color: S.textSecondary, fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ---- Table ---- */}
      <Paper elevation={0} sx={{ borderRadius: '12px', boxShadow: S.shadow, overflow: 'hidden', bgcolor: S.card }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${S.divider}` }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: S.textPrimary }}>
            Signals <Box component="span" sx={{ color: S.textFaint, fontWeight: 400 }}>({filteredSignals.length})</Box>
          </Typography>
        </Box>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                {['Signal', 'Unit', 'Asset', 'Group', 'Color', 'Visible', 'Actions'].map((h, i) => (
                  <TableCell
                    key={h}
                    align={i === 4 || i === 5 ? 'center' : i === 6 ? 'right' : 'left'}
                    sx={{ fontWeight: 600, color: S.textFaint, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${S.divider}`, bgcolor: S.bg }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSignals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                    <Typography variant="body2" sx={{ color: S.textFaint }}>No signals found matching your search.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSignals.map((signal) => (
                  <TableRow
                    key={signal.signal_id}
                    sx={{ '&:hover': { bgcolor: S.bg }, transition: 'background 0.15s' }}
                  >
                    <TableCell sx={{ borderBottom: `1px solid ${S.divider}` }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: `${signal.color_hex || S.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <SsidChartIcon sx={{ fontSize: 18, color: signal.color_hex || S.green }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: S.textPrimary, fontSize: '14px' }}>
                            {signal.custom_name || signal.name}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: S.textFaint }}>{signal.kks_code}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${S.divider}`, color: S.neutralText, fontSize: '14px' }}>
                      {signal.custom_unit || signal.unit || '-'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${S.divider}` }}>
                      {signal.asset_name ? (
                        <Badge label={signal.asset_name} tone="indigo" />
                      ) : (
                        <Badge label="Unassigned" tone="amber" />
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${S.divider}` }}>
                      {signal.group_name ? <Badge label={signal.group_name} tone="neutral" /> : <Badge label="No Group" tone="neutral" />}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: `1px solid ${S.divider}` }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          mx: 'auto',
                          borderRadius: '50%',
                          bgcolor: signal.color_hex || '#2196F3',
                          border: `2px solid ${S.card}`,
                          boxShadow: S.shadow,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: `1px solid ${S.divider}` }}>
                      {signal.is_visible ? (
                        <CheckCircleIcon sx={{ color: S.green, fontSize: 20 }} />
                      ) : (
                        <CancelIcon sx={{ color: S.textFaint, fontSize: 20 }} />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: `1px solid ${S.divider}` }}>
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => setEditingSignal(signal)}
                            sx={{ bgcolor: S.amberBg, color: S.amber, borderRadius: '8px', '&:hover': { transform: 'scale(1.08)' } }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        {signal.is_assigned ? (
                          <Tooltip title="Unassign">
                            <IconButton
                              size="small"
                              onClick={() => handleUnassign(signal.signal_id)}
                              sx={{ bgcolor: S.redBg, color: S.red, borderRadius: '8px', '&:hover': { transform: 'scale(1.08)' } }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Assign to asset">
                            <IconButton
                              size="small"
                              onClick={() => setAssignDialog({ open: true, signalId: signal.signal_id })}
                              sx={{ bgcolor: S.indigoBg, color: S.indigo, borderRadius: '8px', '&:hover': { transform: 'scale(1.08)' } }}
                            >
                              <AddIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ---- Dialogs ---- */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: S.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AddIcon sx={{ color: S.green, fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '18px', color: S.textPrimary }}>Create New Group</Typography>
        </DialogTitle>
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
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setGroupDialogOpen(false)} sx={{ borderRadius: '8px', textTransform: 'none', color: S.neutralText, bgcolor: S.neutralBg, px: 2.5, '&:hover': { bgcolor: S.border } }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={creatingGroup || !newGroupName.trim()}
            startIcon={<SaveIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              px: 3,
              color: '#fff',
              background: `linear-gradient(135deg, ${S.green} 0%, ${S.greenDark} 100%)`,
              '&:hover': { boxShadow: '0 4px 12px rgba(16,185,129,0.4)' },
              '&.Mui-disabled': { background: S.neutralBg, color: S.textFaint },
            }}
          >
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

      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, signalId: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px', color: S.textPrimary }}>Assign Signal to Asset</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: S.textSecondary, mb: 1.5 }}>Select an asset to assign this signal to:</Typography>
          {assets.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: '10px' }}>No assets available in this plant.</Alert>
          ) : (
            <Stack spacing={1}>
              {assets.map(a => (
                <Button
                  key={a.id}
                  fullWidth
                  onClick={() => handleAssign(assignDialog.signalId, a.id)}
                  sx={{
                    justifyContent: 'space-between',
                    py: 1.5,
                    px: 2,
                    textTransform: 'none',
                    borderRadius: '10px',
                    bgcolor: S.bg,
                    color: S.textPrimary,
                    '&:hover': { bgcolor: S.indigoBg },
                  }}
                >
                  <span>{a.asset_name}</span>
                  <Badge label={a.asset_type || 'Asset'} tone="neutral" />
                </Button>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAssignDialog({ open: false, signalId: null })} sx={{ textTransform: 'none', color: S.neutralText }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: '10px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignalConfiguration;

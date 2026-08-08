import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Thermostat as ThermostatIcon,
  Air as AirIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';

import {
  getRULConfig,
  saveRULConfig,
  getRULAvailableSignals,
} from '../../../../../api/rul';

// ---- Design tokens (match SignalConfiguration.jsx) ----
const S = {
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textFaint: '#94a3b8',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  green: '#10b981',
  greenDark: '#059669',
};

// The 3 roles the algorithm consumes, in display order.
const ROLES = [
  {
    key: 'top_oil_signal_id',
    label: 'Top Oil Temperature',
    hint: 'Measured top-oil temperature (°C). Required.',
    icon: <ThermostatIcon fontSize="small" sx={{ color: '#ef4444' }} />,
    required: true,
  },
  {
    key: 'ambient_signal_id',
    label: 'Ambient Temperature',
    hint: 'Ambient air temperature (°C). Required.',
    icon: <AirIcon fontSize="small" sx={{ color: '#3b82f6' }} />,
    required: true,
  },
  {
    key: 'current_signal_id',
    label: 'Load Current',
    hint: 'Load current (A). Optional — enables the load-current validation method.',
    icon: <BoltIcon fontSize="small" sx={{ color: '#f59e0b' }} />,
    required: false,
  },
];

const signalLabel = (s) => {
  const parts = [s.name || s.kks_code || `Signal ${s.id}`];
  if (s.kks_code && s.name) parts.push(`(${s.kks_code})`);
  if (s.unit) parts.push(`· ${s.unit}`);
  return parts.join(' ');
};

const RULSettings = ({ assetId }) => {
  const [signals, setSignals] = useState([]);
  const [mapping, setMapping] = useState({
    top_oil_signal_id: '',
    ambient_signal_id: '',
    current_signal_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState(null); // { severity, message }

  const load = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const [signalsRes, cfg] = await Promise.all([
        getRULAvailableSignals(assetId),
        getRULConfig(assetId),
      ]);
      setSignals(signalsRes?.signals || []);
      setMapping({
        top_oil_signal_id: cfg?.top_oil_signal_id ?? '',
        ambient_signal_id: cfg?.ambient_signal_id ?? '',
        current_signal_id: cfg?.current_signal_id ?? '',
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || 'Failed to load signal configuration'
      );
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (key) => (e) => {
    const v = e.target.value;
    setMapping((m) => ({ ...m, [key]: v === '' ? '' : Number(v) }));
  };

  const handleSave = async () => {
    // Required roles must be set.
    for (const role of ROLES) {
      if (role.required && !mapping[role.key]) {
        setSnack({ severity: 'warning', message: `${role.label} is required.` });
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        top_oil_signal_id: mapping.top_oil_signal_id || null,
        ambient_signal_id: mapping.ambient_signal_id || null,
        current_signal_id: mapping.current_signal_id || null,
      };
      await saveRULConfig(assetId, payload);
      setSnack({ severity: 'success', message: 'Signal mapping saved.' });
    } catch (err) {
      setSnack({
        severity: 'error',
        message: err.response?.data?.detail || err.message || 'Failed to save mapping',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress sx={{ color: S.green }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 780, mx: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={load}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 3, background: S.card, borderRadius: 3, boxShadow: S.shadow }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: S.textPrimary }}>
            DCS Signal Mapping
          </Typography>
          <Chip
            size="small"
            label={`${signals.length} signals in plant`}
            sx={{ background: '#eef2ff', color: '#4f46e5', fontWeight: 600 }}
          />
        </Stack>
        <Typography sx={{ fontSize: 13, color: S.textSecondary, mb: 3 }}>
          Map each input the IEC 60076-7 thermal-life algorithm needs to a DCS signal
          in this asset's plant. Hourly history for the mapped signals is used on each run.
        </Typography>

        <Stack spacing={3}>
          {ROLES.map((role) => (
            <Box key={role.key}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                {role.icon}
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: S.textPrimary }}>
                  {role.label}
                </Typography>
                {role.required && (
                  <Chip size="small" label="required" sx={{ height: 18, fontSize: 10, background: '#fef2f2', color: '#dc2626' }} />
                )}
              </Stack>
              <TextField
                select
                fullWidth
                size="small"
                value={mapping[role.key] === '' ? '' : String(mapping[role.key])}
                onChange={handleChange(role.key)}
                helperText={role.hint}
              >
                <MenuItem value="">
                  <em>— Not mapped —</em>
                </MenuItem>
                {signals.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {signalLabel(s)}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving || !signals.length}
            onClick={handleSave}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${S.green}, ${S.greenDark})`,
              boxShadow: '0 4px 6px rgba(16,185,129,0.3)',
              '&:hover': { background: `linear-gradient(135deg, ${S.greenDark}, ${S.green})` },
            }}
          >
            {saving ? 'Saving…' : 'Save Mapping'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600, color: S.textSecondary, borderColor: S.border }}
          >
            Reload
          </Button>
        </Stack>

        {!signals.length && !error && (
          <Alert severity="info" sx={{ mt: 3 }}>
            No DCS signals found for this asset's plant. Confirm the plant has signals in the
            DCS database.
          </Alert>
        )}
      </Paper>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default RULSettings;

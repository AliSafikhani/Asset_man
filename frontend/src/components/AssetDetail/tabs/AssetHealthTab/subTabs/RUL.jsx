import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import {
  Insights as InsightsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import RULResults from './RULResults';
import RULSettings from './RULSettings';

/**
 * RUL (Remaining Useful Life) — IEC 60076-7 thermal life.
 *
 * Two inner tabs:
 *   Results  — runs the algorithm and renders the assessment.
 *   Settings — maps the 3 DCS signals (Top Oil / Ambient / Current) the
 *              algorithm consumes to real signals of the asset's plant.
 */
const RUL = ({ asset, assetId }) => {
  const [tab, setTab] = useState(0);
  // Bumped whenever the signal mapping is saved, so the Results tab re-runs
  // the assessment with the new configuration instead of its cached result.
  const [refreshKey, setRefreshKey] = useState(0);
  const plantId = asset?.plant_id;

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
    setTab(0); // jump to Results so the user sees the updated assessment
  };

  return (
    <Box sx={{ background: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff', px: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          TabIndicatorProps={{ style: { background: '#10b981', height: 3 } }}
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              color: '#64748b',
              minHeight: 48,
            },
            '& .Mui-selected': { color: '#0f172a' },
          }}
        >
          <Tab icon={<InsightsIcon fontSize="small" />} iconPosition="start" label="Results" />
          <Tab icon={<SettingsIcon fontSize="small" />} iconPosition="start" label="Settings" />
        </Tabs>
      </Box>

      <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
        <RULResults
          asset={asset}
          assetId={assetId}
          refreshKey={refreshKey}
          onConfigure={() => setTab(1)}
        />
      </Box>
      <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
        <RULSettings asset={asset} assetId={assetId} plantId={plantId} onSaved={handleSaved} />
      </Box>
    </Box>
  );
};

export default RUL;

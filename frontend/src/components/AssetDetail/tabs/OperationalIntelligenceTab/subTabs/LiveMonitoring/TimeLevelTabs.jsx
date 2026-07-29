/**
 * TimeLevelTabs Component
 * File: components/AssetDetail/tabs/OperationalIntelligenceTab/subTabs/LiveMonitoring/TimeLevelTabs.jsx
 * Description: Tab switcher for Raw, Minute, and Hour data levels
 */

import React from 'react';
import {
  Tabs,
  Tab,
  Box,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
  minWidth: 120,
  padding: '12px 16px',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderRadius: '4px 4px 0 0',
  },
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
}));

const TimeLevelTabs = ({ levels, activeLevel, onChange, dataCounts = {}, dataRange = null }) => {
  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No data';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <StyledTabs
        value={activeLevel}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="time level tabs"
      >
        {levels.map((level) => {
          const count = dataCounts[level.id] || 0;

          return (
            <Tooltip
              key={level.id}
              title={`${level.label} - ${level.maxDays} days retention`}
              placement="top"
            >
              <StyledTab
                value={level.id}   // ✅ CRITICAL: must have this
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{level.label}</span>
                    {count > 0 && (
                      <Chip
                        label={count}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.625rem',
                          minWidth: 18,
                          backgroundColor: level.id === activeLevel ? 'primary.main' : 'grey.300',
                          color: level.id === activeLevel ? 'white' : 'text.secondary',
                        }}
                      />
                    )}
                  </Box>
                }
              />
            </Tooltip>
          );
        })}
      </StyledTabs>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 1,
          backgroundColor: 'action.hover',
          borderRadius: '0 0 4px 4px',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary">
            <strong>Active:</strong> {levels.find(l => l.id === activeLevel)?.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <strong>Retention:</strong> {levels.find(l => l.id === activeLevel)?.maxDays} days
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <strong>Data Range:</strong>{' '}
            {dataRange?.min_timestamp && dataRange?.max_timestamp ? (
              `${formatDate(dataRange.min_timestamp)} → ${formatDate(dataRange.max_timestamp)}`
            ) : (
              'No data available'
            )}
          </Typography>
          {dataRange?.min_timestamp && dataRange?.max_timestamp && (
            <Chip
              label={`${Math.round((new Date(dataRange.max_timestamp) - new Date(dataRange.min_timestamp)) / (1000 * 60 * 60 * 24))} days`}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: '0.5rem' }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {activeLevel === 'raw' && '1 sample per second'}
          {activeLevel === 'minute' && '1 sample per minute (aggregated)'}
          {activeLevel === 'hour' && '1 sample per hour (aggregated)'}
        </Typography>
      </Box>
    </Box>
  );
};

export default TimeLevelTabs;
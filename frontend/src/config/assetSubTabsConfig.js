// frontend/src/config/assetSubTabsConfig.js
// Defines all sub-tabs for each module (Asset Profile, Asset Health, etc.)
export const SUB_TABS_CONFIG = {
  assetProfile: {
    id: 'assetProfile',
    label: 'Asset Profile',
    subTabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'specifications', label: 'Specifications' },
      { id: 'history', label: 'History' },
      { id: 'documents', label: 'Documents' },
    ],
  },
  assetHealth: {
    id: 'assetHealth',
    label: 'Asset Health',
    subTabs: [
      { id: 'healthIndex', label: 'Health Index' },
      { id: 'risk', label: 'Risk' },
      { id: 'rul', label: 'RUL' },
      { id: 'recommendations', label: 'Recommendations' },
      { id: 'iec62874', label: 'IEC 62874' },   // <-- NEW
    ],
  },
  conditionDiagnostics: {
    id: 'conditionDiagnostics',
    label: 'Condition Diagnostics',
    subTabs: [
      { id: 'testResults', label: 'Test Results' },
      { id: 'diagnostics', label: 'Diagnostics' },
      { id: 'trends', label: 'Trends' },
      { id: 'reports', label: 'Reports' },
    ],
  },
  operationalIntelligence: {
    id: 'operationalIntelligence',
    label: 'Operational Intelligence',
    subTabs: [
      { id: 'liveMonitoring', label: 'Live Monitoring' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'alarms', label: 'Alarms' },
      { id: 'events', label: 'Events' },
    ],
  },
  fleetAnalytics: {
    id: 'fleetAnalytics',
    label: 'Fleet Analytics',
    subTabs: [
      { id: 'similarAssets', label: 'Similar Assets' },
      { id: 'benchmarking', label: 'Benchmarking' },
      { id: 'statistics', label: 'Statistics' },
      { id: 'ranking', label: 'Ranking' },
    ],
  },
  decisionSupport: {
    id: 'decisionSupport',
    label: 'Decision Support',
    subTabs: [
      { id: 'recommendations', label: 'Recommendations' },
      { id: 'maintenance', label: 'Maintenance' },
      { id: 'reports', label: 'Reports' },
      { id: 'knowledgeBase', label: 'Knowledge Base' },
    ],
  },
};

// Helper: get all sub-tabs for a module ID
export const getSubTabsForModule = (moduleId) => {
  return SUB_TABS_CONFIG[moduleId]?.subTabs || [];
};

// Helper: get a specific sub-tab by moduleId and subTabId
export const getSubTabById = (moduleId, subTabId) => {
  const module = SUB_TABS_CONFIG[moduleId];
  if (!module) return null;
  return module.subTabs.find(st => st.id === subTabId) || null;
};
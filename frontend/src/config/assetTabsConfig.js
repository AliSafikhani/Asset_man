// frontend/src/config/assetTabsConfig.js
// Defines the 5 main modules (tabs) with lazy imports for their container components
import { SUB_TABS_CONFIG } from './assetSubTabsConfig';

export const MAIN_TABS = [
  {
    id: 'assetProfile',
    label: 'Asset Profile',
    component: () => import('../components/AssetDetail/tabs/AssetProfileTab'),
    subTabs: SUB_TABS_CONFIG.assetProfile.subTabs,
  },
  {
    id: 'assetHealth',
    label: 'Asset Health',
    component: () => import('../components/AssetDetail/tabs/AssetHealthTab'),
    subTabs: SUB_TABS_CONFIG.assetHealth.subTabs,
  },
  {
    id: 'conditionDiagnostics',
    label: 'Condition Diagnostics',
    component: () => import('../components/AssetDetail/tabs/ConditionDiagnosticsTab'),
    subTabs: SUB_TABS_CONFIG.conditionDiagnostics.subTabs,
  },
  {
    id: 'operationalIntelligence',
    label: 'Operational Intelligence',
    component: () => import('../components/AssetDetail/tabs/OperationalIntelligenceTab'),
    subTabs: SUB_TABS_CONFIG.operationalIntelligence.subTabs,
  },
  // {
  //   id: 'fleetAnalytics',
  //   label: 'Fleet Analytics',
  //   component: () => import('../components/AssetDetail/tabs/FleetAnalyticsTab'),
  //   subTabs: SUB_TABS_CONFIG.fleetAnalytics.subTabs,
  // },
  {
    id: 'decisionSupport',
    label: 'Decision Support',
    component: () => import('../components/AssetDetail/tabs/DecisionSupportTab'),
    subTabs: SUB_TABS_CONFIG.decisionSupport.subTabs,
  },
];
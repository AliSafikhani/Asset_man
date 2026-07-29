import React, { useState, Suspense, lazy } from 'react';
import { getSubTabsForModule } from '../../../../config/assetSubTabsConfig';
import SubTabNavigation from '../../common/SubTabNavigation';
import LoadingSpinner from '../../../ui/LoadingSpinner';


// Lazy load sub‑tabs
const LiveMonitoring = lazy(() => import('./subTabs/LiveMonitoring'));
const SignalConfiguration = lazy(() => import('./subTabs/SignalConfiguration'));
const Analytics = lazy(() => import('./subTabs/Analytics'));
const Alarms = lazy(() => import('./subTabs/Alarms'));
const Events = lazy(() => import('./subTabs/Events'));

const SUB_TAB_COMPONENTS = {
  liveMonitoring: LiveMonitoring,
  signalConfiguration: SignalConfiguration,  // ← NEW
  analytics: Analytics,
  alarms: Alarms,
  events: Events,
};

const OperationalIntelligenceTab = ({ asset, assetId }) => {
  const [activeSubTabId, setActiveSubTabId] = useState('liveMonitoring');
  
  const subTabs = getSubTabsForModule('operationalIntelligence');
  const ActiveComponent = SUB_TAB_COMPONENTS[activeSubTabId];

  return (
    <div style={{ padding: '16px' }}>
      <SubTabNavigation
        tabs={subTabs}
        activeId={activeSubTabId}
        onSelect={setActiveSubTabId}
      />
      <div style={{ marginTop: '20px' }}>
        <Suspense fallback={<LoadingSpinner />}>
          <ActiveComponent 
            asset={asset} 
            assetId={assetId} 
            plantId={asset?.plant_id}   // ✅ ADD THIS
          />
        </Suspense>
      </div>
    </div>
  );
};

export default OperationalIntelligenceTab;
// frontend/src/components/AssetDetail/tabs/FleetAnalyticsTab/index.jsx
import React, { useState, Suspense, lazy } from 'react';
import { getSubTabsForModule } from '../../../../config/assetSubTabsConfig';
import SubTabNavigation from '../../common/SubTabNavigation';
import LoadingSpinner from '../../../ui/LoadingSpinner';

// Lazy load sub‑tabs
const SimilarAssets = lazy(() => import('./subTabs/SimilarAssets'));
const Benchmarking = lazy(() => import('./subTabs/Benchmarking'));
const Statistics = lazy(() => import('./subTabs/Statistics'));
const Ranking = lazy(() => import('./subTabs/Ranking'));

const SUB_TAB_COMPONENTS = {
  similarAssets: SimilarAssets,
  benchmarking: Benchmarking,
  statistics: Statistics,
  ranking: Ranking,
};

const FleetAnalyticsTab = ({ asset, assetId }) => {
  const [activeSubTabId, setActiveSubTabId] = useState('similarAssets');
  
  const subTabs = getSubTabsForModule('fleetAnalytics');
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
          <ActiveComponent asset={asset} assetId={assetId} />
        </Suspense>
      </div>
    </div>
  );
};

export default FleetAnalyticsTab;
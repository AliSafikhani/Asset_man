// frontend/src/components/AssetDetail/tabs/AssetProfileTab/index.jsx
import React, { useState, Suspense, lazy } from 'react';
import { getSubTabsForModule } from '../../../../config/assetSubTabsConfig';
import SubTabNavigation from '../../common/SubTabNavigation';
import LoadingSpinner from '../../../ui/LoadingSpinner';

// Lazy load sub‑tabs (we'll create these next)
const Overview = lazy(() => import('./subTabs/Overview'));
const Specifications = lazy(() => import('./subTabs/Specifications'));
const History = lazy(() => import('./subTabs/History'));
const Documents = lazy(() => import('./subTabs/Documents'));

// Map sub‑tab IDs to components
const SUB_TAB_COMPONENTS = {
  overview: Overview,
  specifications: Specifications,
  history: History,
  documents: Documents,
};

const AssetProfileTab = ({ asset, assetId }) => {
  const [activeSubTabId, setActiveSubTabId] = useState('overview');
  
  const subTabs = getSubTabsForModule('assetProfile');
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

export default AssetProfileTab;
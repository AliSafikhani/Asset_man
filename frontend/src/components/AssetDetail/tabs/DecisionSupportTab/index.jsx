// frontend/src/components/AssetDetail/tabs/DecisionSupportTab/index.jsx
import React, { useState, Suspense, lazy } from 'react';
import { getSubTabsForModule } from '../../../../config/assetSubTabsConfig';
import SubTabNavigation from '../../common/SubTabNavigation';
import LoadingSpinner from '../../../ui/LoadingSpinner';

// Lazy load sub‑tabs
const Recommendations = lazy(() => import('./subTabs/Recommendations'));
const Maintenance = lazy(() => import('./subTabs/Maintenance'));
const Reports = lazy(() => import('./subTabs/Reports'));
const KnowledgeBase = lazy(() => import('./subTabs/KnowledgeBase'));

const SUB_TAB_COMPONENTS = {
  recommendations: Recommendations,
  maintenance: Maintenance,
  reports: Reports,
  knowledgeBase: KnowledgeBase,
};

const DecisionSupportTab = ({ asset, assetId }) => {
  const [activeSubTabId, setActiveSubTabId] = useState('recommendations');
  
  const subTabs = getSubTabsForModule('decisionSupport');
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

export default DecisionSupportTab;
// frontend/src/components/AssetDetail/tabs/ConditionDiagnosticsTab/index.jsx
import React, { useState, Suspense, lazy } from 'react';
import { getSubTabsForModule } from '../../../../config/assetSubTabsConfig';
import SubTabNavigation from '../../common/SubTabNavigation';
import LoadingSpinner from '../../../ui/LoadingSpinner';

// Lazy load sub‑tabs
const TestResults = lazy(() => import('./subTabs/TestResults'));
const Diagnostics = lazy(() => import('./subTabs/Diagnostics'));
const Trends = lazy(() => import('./subTabs/Trends'));
const Reports = lazy(() => import('./subTabs/Reports'));

const SUB_TAB_COMPONENTS = {
  testResults: TestResults,
  diagnostics: Diagnostics,
  trends: Trends,
  reports: Reports,
};

const ConditionDiagnosticsTab = ({ asset, assetId }) => {
  const [activeSubTabId, setActiveSubTabId] = useState('testResults');
  
  const subTabs = getSubTabsForModule('conditionDiagnostics');
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

export default ConditionDiagnosticsTab;
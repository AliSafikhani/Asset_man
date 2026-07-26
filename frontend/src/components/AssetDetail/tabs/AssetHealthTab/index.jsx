// frontend/src/components/AssetDetail/tabs/AssetHealthTab/index.jsx
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { getSubTabsForModule } from '../../../../config/assetSubTabsConfig';
import SubTabNavigation from '../../common/SubTabNavigation';
import LoadingSpinner from '../../../ui/LoadingSpinner';

// Lazy load sub‑tabs
const HealthIndex = lazy(() => import('./subTabs/HealthIndex'));
const Risk = lazy(() => import('./subTabs/Risk'));
const RUL = lazy(() => import('./subTabs/RUL'));
const Recommendations = lazy(() => import('./subTabs/Recommendations'));
const IEC62874 = lazy(() => import('./subTabs/IEC62874'));

const SUB_TAB_COMPONENTS = {
  healthIndex: HealthIndex,
  risk: Risk,
  rul: RUL,
  recommendations: Recommendations,
  iec62874: IEC62874,
};

const AssetHealthTab = ({ asset, assetId }) => {
  // Get all sub‑tabs from config
  const allSubTabs = getSubTabsForModule('assetHealth');

  // Filter sub‑tabs based on asset type
  const filteredSubTabs = React.useMemo(() => {
    // If asset is not a transformer, remove IEC 62874
    if (asset?.asset_type !== 'transformer') {
      return allSubTabs.filter(st => st.id !== 'iec62874');
    }
    return allSubTabs;
  }, [asset, allSubTabs]);

  // Set initial active sub‑tab to the first available one
  const [activeSubTabId, setActiveSubTabId] = useState(() => {
    const first = filteredSubTabs[0];
    return first ? first.id : 'healthIndex';
  });

  // If active sub‑tab is no longer in the filtered list (e.g., IEC removed), reset to first
  useEffect(() => {
    const stillExists = filteredSubTabs.some(st => st.id === activeSubTabId);
    if (!stillExists && filteredSubTabs.length > 0) {
      setActiveSubTabId(filteredSubTabs[0].id);
    }
  }, [filteredSubTabs, activeSubTabId]);

  const ActiveComponent = SUB_TAB_COMPONENTS[activeSubTabId];

  return (
    <div style={{ padding: '16px' }}>
      <SubTabNavigation
        tabs={filteredSubTabs}
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

export default AssetHealthTab;
// frontend/src/components/AssetDetail/common/LazyTab.jsx
import React, { Suspense, lazy } from 'react';

const LazyTab = ({ importFn, componentProps = {}, fallback = null }) => {
  const Component = lazy(importFn);
  const fallbackElement = fallback || <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  return (
    <Suspense fallback={fallbackElement}>
      <Component {...componentProps} />
    </Suspense>
  );
};

export default LazyTab;
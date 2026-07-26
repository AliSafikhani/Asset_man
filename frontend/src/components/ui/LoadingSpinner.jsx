import React from 'react';

const LoadingSpinner = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '200px',
      color: '#94a3b8',
      fontSize: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '12px'
      }} />
      Loading...
    </div>
  );
};

export default LoadingSpinner;

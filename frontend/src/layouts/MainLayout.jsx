// frontend/src/components/layout/MainLayout.jsx

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { authAPI } from '../services/api';
import { FaExclamationTriangle, FaWifi, FaServer } from 'react-icons/fa';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      loadUser();
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
    } catch (error) {
      console.error('Error loading user:', error);
      setError('Failed to load user information');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'Dashboard';
    if (path.startsWith('/companies')) return 'Companies';
    if (path.startsWith('/plants')) return 'Plants';
    if (path.startsWith('/assets')) return 'Assets';
    if (path.startsWith('/tests')) return 'Tests';
    if (path.startsWith('/dcs')) return 'DCS Signals';
    if (path.startsWith('/alarms')) return 'Alarms';
    if (path.startsWith('/events')) return 'Events';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/profile')) return 'Profile';
    return 'Asset Management';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>🏢</div>
            <span style={styles.logoText}>Asset<span style={styles.logoHighlight}>Hub</span></span>
          </div>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading your workspace...</p>
          <div style={styles.loadingDots}>
            <span style={styles.dot}></span>
            <span style={{ ...styles.dot, animationDelay: '0.2s' }}></span>
            <span style={{ ...styles.dot, animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorContent}>
          <FaExclamationTriangle size={48} color="#ef4444" />
          <h2 style={styles.errorTitle}>Something went wrong</h2>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryButton} onClick={loadUser}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <TopBar 
        userName={user?.username} 
        onLogout={handleLogout} 
        toggleSidebar={toggleSidebar}
        isSidebarCollapsed={isCollapsed}
      />

      {!isOnline && (
        <div style={styles.offlineBanner}>
          <FaWifi size={16} style={styles.offlineIcon} />
          <span>You are offline. Some features may be unavailable.</span>
          <button style={styles.offlineDismiss} onClick={() => setIsOnline(true)}>
            ✕
          </button>
        </div>
      )}

      <div style={styles.mainContent}>
        <Sidebar 
          isCollapsed={isCollapsed} 
          onToggle={toggleSidebar}
          userName={user?.username}
        />
        
        {/* Content Area - FIXED: No margin, just flex:1 */}
        <div style={styles.contentArea}>
          <div style={styles.pageHeader}>
            <div style={styles.pageHeaderLeft}>
              <h1 style={styles.pageTitle}>{getPageTitle()}</h1>
              <span style={styles.pagePath}>{location.pathname}</span>
            </div>
            <div style={styles.pageHeaderRight}>
              <div style={styles.connectionStatus}>
                <span style={{
                  ...styles.statusDot,
                  background: isOnline ? '#10b981' : '#ef4444'
                }} />
                <span style={styles.statusText}>
                  {isOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
              {user && (
                <div style={styles.userStatus}>
                  <FaServer size={14} color="#94a3b8" />
                  <span style={styles.userStatusText}>
                    {user.username || 'User'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={styles.pageContent}>
            <Outlet />
          </div>

          <div style={styles.footer}>
            <span>© 2026 AssetHub. All rights reserved.</span>
            <span>Version 2.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#f8fafc',
    overflow: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f8fafc',
  },
  loadingContent: {
    textAlign: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
  },
  logoHighlight: {
    color: '#4f46e5',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '16px',
    marginBottom: '16px',
  },
  loadingDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    background: '#4f46e5',
    borderRadius: '50%',
    animation: 'pulse 1.4s infinite',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f8fafc',
  },
  errorContent: {
    textAlign: 'center',
    maxWidth: '400px',
    padding: '40px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '16px 0 8px 0',
  },
  errorText: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '24px',
  },
  retryButton: {
    padding: '10px 32px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  contentArea: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  offlineBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 24px',
    background: '#fef3c7',
    color: '#92400e',
    fontSize: '14px',
    borderBottom: '1px solid #f59e0b',
    flexShrink: 0,
  },
  offlineIcon: {
    flexShrink: 0,
  },
  offlineDismiss: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#92400e',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  pagePath: {
    fontSize: '12px',
    color: '#94a3b8',
    background: '#f1f5f9',
    padding: '4px 12px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  pageHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#64748b',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  statusText: {
    fontWeight: '500',
  },
  userStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#64748b',
    padding: '4px 12px',
    background: '#f1f5f9',
    borderRadius: '6px',
  },
  userStatusText: {
    fontWeight: '500',
  },
  pageContent: {
    flex: 1,
    paddingBottom: '16px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 0 8px 0',
    borderTop: '1px solid #e2e8f0',
    marginTop: 'auto',
    fontSize: '12px',
    color: '#94a3b8',
    flexShrink: 0,
  },
};

// Add keyframes to document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
  .retry-button:hover {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79,70,229,0.3);
  }
`;
document.head.appendChild(styleSheet);

export default MainLayout;
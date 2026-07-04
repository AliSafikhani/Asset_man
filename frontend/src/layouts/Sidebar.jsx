import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: '', label: 'Dashboard', color: '#4f46e5' },
    { path: '/companies', icon: '', label: 'Companies', color: '#10b981' },
    { path: '/plants', icon: '', label: 'Plants', color: '#3b82f6' },
    { path: '/assets', icon: '', label: 'Assets', color: '#f59e0b' },
    { path: '/tests', icon: '', label: 'Tests', color: '#8b5cf6' },
    { path: '/dcs', icon: '', label: 'DCS Signals', color: '#06b6d4' },
    { path: '/alarms', icon: '', label: 'Alarms', color: '#dc3545' },
    { path: '/events', icon: '📋', label: 'Events', color: '#198754' },
    { path: '/reports', icon: '📈', label: 'Reports', color: '#ef4444' },
    { path: '/settings', icon: '⚙️', label: 'Settings', color: '#6b7280' }
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  const showLabels = !isCollapsed || isHovered;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isCollapsed ? (isHovered ? '240px' : '70px') : '240px',
        background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'relative',
        zIndex: 10,
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* Logo Area */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed && !isHovered ? 'center' : 'flex-start',
        gap: '12px'
      }}>
        <span style={{ fontSize: '28px' }}></span>
        {showLabels && (
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>AMS</span>
        )}
      </div>

      {/* Menu Items */}
      <div style={{ flex: 1, padding: '16px 0' }}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleNavigate(item.path)}
            style={{
              padding: '12px 20px',
              margin: '4px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: isActive(item.path) ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
              borderLeft: isActive(item.path) ? `3px solid ${item.color}` : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)';
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            {showLabels && (
              <span style={{ fontSize: '14px', fontWeight: isActive(item.path) ? '600' : '400' }}>
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Collapse Toggle */}
      <div
        onClick={onToggle}
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #374151',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#374151';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ fontSize: '20px' }}>{isCollapsed ? '→' : '←'}</span>
        {showLabels && <span style={{ fontSize: '14px' }}>Collapse Menu</span>}
      </div>
    </div>
  );
};

export default Sidebar;

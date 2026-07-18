// frontend/src/components/layout/Sidebar.jsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaBuilding, FaIndustry, FaServer, FaFlask, 
  FaSignal, FaBell, FaCalendarAlt, FaChartLine, FaCog,
  FaChevronLeft, FaChevronRight, FaUser, FaUserCircle,
  FaBolt, FaPlug, FaCogs, FaMicrochip, FaLock
} from 'react-icons/fa';
import { MdDashboard, MdTransform, MdSettings, MdLogout } from 'react-icons/md';
import { HiOutlineLogout } from 'react-icons/hi';
import { SiDatadog } from 'react-icons/si';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: <MdDashboard size={20} />, 
      label: 'Dashboard', 
      color: '#4f46e5',
      badge: null,
      disabled: false  // Added disabled property
    },
    { 
      path: '/companies', 
      icon: <FaBuilding size={18} />, 
      label: 'Companies', 
      color: '#10b981',
      badge: null,
      disabled: false
    },
    { 
      path: '/plants', 
      icon: <FaIndustry size={18} />, 
      label: 'Plants', 
      color: '#3b82f6',
      badge: null,
      disabled: false
    },
    { 
      path: '/assets', 
      icon: <FaServer size={18} />, 
      label: 'Assets', 
      color: '#f59e0b',
      badge: null,
      disabled: false
    },
    { 
      path: '/tests', 
      icon: <FaFlask size={18} />, 
      label: 'Tests', 
      color: '#8b5cf6',
      badge: null,
      disabled: true  // DISABLED - This tab will be greyed out
    },
    { 
      path: '/dcs', 
      icon: <FaSignal size={18} />, 
      label: 'DCS Signals', 
      color: '#06b6d4',
      badge: null,
      disabled: true
    },
    { 
      path: '/Alarms', 
      icon: <FaBell size={18} />, 
      label: 'Alarms', 
      color: '#ef4444',
      badge: null,
      disabled: true
    },
    { 
      path: '/events', 
      icon: <FaCalendarAlt size={18} />, 
      label: 'Events', 
      color: '#198754',
      badge: null,
      disabled: true
    },
    { 
      path: '/reports', 
      icon: <FaChartLine size={18} />, 
      label: 'Reports', 
      color: '#f97316',
      badge: null,
      disabled: true
    },
    { 
      path: '/settings', 
      icon: <FaCog size={18} />, 
      label: 'Settings', 
      color: '#64748b',
      badge: null,
      disabled: true
    }
  ];

  const handleNavigate = (path, index) => {
    // Check if the item is disabled
    if (menuItems[index].disabled) {
      return; // Don't navigate if disabled
    }
    setActiveItem(index);
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
        width: isCollapsed ? (isHovered ? '280px' : '72px') : '280px',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 100,
        boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
        height: '100vh',
        overflow: 'hidden',
        flexShrink: 0,
        minWidth: isCollapsed ? (isHovered ? '280px' : '72px') : '280px',
      }}
    >
      {/* Decorative Gradient Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #4f46e5, #8b5cf6, #06b6d4)',
        zIndex: 1
      }} />

      {/* Logo Area */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed && !isHovered ? 'center' : 'flex-start',
        gap: '12px',
        minHeight: '80px',
        position: 'relative'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
          flexShrink: 0
        }}>
          <SiDatadog size={24} color="white" />
        </div>
        {showLabels && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.2
          }}>
            <span style={{
              fontWeight: '700',
              fontSize: '20px',
              background: 'linear-gradient(135deg, #fff 30%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Power<span style={{ color: '#4f46e5', WebkitTextFillColor: '#4f46e5' }}>Guardian</span>
            </span>
            <span style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: '400',
              letterSpacing: '0.5px'
            }}>
              Asset Management System
            </span>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: isCollapsed && !isHovered ? 'none' : 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '600',
          color: 'white',
          flexShrink: 0
        }}>
          <FaUser size={20} />
        </div>
        {showLabels && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>
              Admin User
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              admin@example.com
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div style={{
        flex: 1,
        padding: '16px 12px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* Section Label */}
        {showLabels && (
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            padding: '8px 12px 12px 12px'
          }}>
            Main Menu
          </div>
        )}
        
        {menuItems.map((item, index) => {
          const active = isActive(item.path);
          const isDisabled = item.disabled || false;
          
          return (
            <div
              key={index}
              onClick={() => handleNavigate(item.path, index)}
              style={{
                padding: '10px 14px',
                margin: '2px 0',
                borderRadius: '10px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: active && !isDisabled ? `rgba(79, 70, 229, 0.15)` : 'transparent',
                border: active && !isDisabled ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                position: 'relative',
                opacity: isDisabled ? 0.4 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!active && !isDisabled) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active && !isDisabled) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Active Indicator */}
              {active && !isDisabled && (
                <div style={{
                  position: 'absolute',
                  left: '-4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '4px',
                  height: '28px',
                  background: 'linear-gradient(180deg, #4f46e5, #7c3aed)',
                  borderRadius: '4px'
                }} />
              )}
              
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active && !isDisabled ? `rgba(79, 70, 229, 0.2)` : 'rgba(255,255,255,0.04)',
                color: active && !isDisabled ? '#4f46e5' : '#94a3b8',
                transition: 'all 0.2s',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              
              {showLabels && (
                <>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: active && !isDisabled ? '600' : '400',
                    color: active && !isDisabled ? '#f1f5f9' : '#cbd5e1',
                    flex: 1
                  }}>
                    {item.label}
                  </span>
                  {isDisabled && (
                    <span style={{
                      fontSize: '10px',
                      color: '#64748b',
                      background: 'rgba(100, 116, 139, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}>
                      <FaLock size={10} style={{ marginRight: '4px' }} />
                      Locked
                    </span>
                  )}
                  {item.badge && !isDisabled && (
                    <span style={{
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '1px 8px',
                      borderRadius: '12px',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '12px'
      }}>
        {/* Logout Button */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          onClick={() => {
            console.log('Logout clicked');
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            flexShrink: 0
          }}>
            <HiOutlineLogout size={18} />
          </div>
          {showLabels && (
            <span style={{
              fontSize: '14px',
              color: '#ef4444',
              fontWeight: '500'
            }}>
              Logout
            </span>
          )}
        </div>

        {/* Collapse Toggle */}
        <div
          onClick={onToggle}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'rgba(255,255,255,0.04)',
            marginTop: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            flexShrink: 0,
            transition: 'transform 0.3s'
          }}>
            {isCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
          </div>
          {showLabels && (
            <span style={{
              fontSize: '13px',
              color: '#94a3b8',
              fontWeight: '400'
            }}>
              {isCollapsed ? 'Expand Menu' : 'Collapse Menu'}
            </span>
          )}
        </div>
      </div>

      {/* Version Info */}
      {showLabels && (
        <div style={{
          padding: '8px 20px 16px 20px',
          fontSize: '11px',
          color: '#475569',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.04)'
        }}>
          <span style={{ display: 'block' }}>v2.0.0</span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
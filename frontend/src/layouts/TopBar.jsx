// frontend/src/components/layout/TopBar.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaUser, FaUserCircle, FaCog, FaSignOutAlt, 
  FaBell, FaSearch, FaBars, FaQuestionCircle,
  FaMoon, FaSun, FaChevronDown, FaUserCog,
  FaShieldAlt, FaDatabase, FaClock
} from 'react-icons/fa';
import { MdDashboard, MdLogout } from 'react-icons/md';

const TopBar = ({ userName, onLogout, toggleSidebar, isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const notifications = [
    { id: 1, title: 'New test result added', time: '5 min ago', read: false, type: 'success' },
    { id: 2, title: 'Asset health score updated', time: '1 hour ago', read: false, type: 'info' },
    { id: 3, title: 'DGA analysis completed', time: '3 hours ago', read: true, type: 'warning' },
    { id: 4, title: 'System maintenance scheduled', time: '1 day ago', read: true, type: 'info' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Apply dark mode to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#e2e8f0';
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/assets?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    toast.success(isDarkMode ? 'Light mode activated 🌞' : 'Dark mode activated 🌙');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📌';
    }
  };

  // Dark mode styles
  const darkModeStyles = isDarkMode ? {
    container: {
      background: '#1e293b',
      borderBottom: '1px solid #334155',
    },
    searchWrapper: {
      background: '#334155',
      border: '1px solid #475569',
    },
    searchInput: {
      color: '#e2e8f0',
    },
    iconButtonHover: '#334155',
    userButtonHover: '#334155',
    dropdown: {
      background: '#1e293b',
      border: '1px solid #334155',
    },
    dropdownHeader: {
      borderBottom: '1px solid #334155',
    },
    dropdownTitle: {
      color: '#f1f5f9',
    },
    notificationItem: {
      borderBottom: '1px solid #334155',
    },
    notificationTitle: {
      color: '#f1f5f9',
    },
    notificationTime: {
      color: '#94a3b8',
    },
    userDropdown: {
      background: '#1e293b',
      border: '1px solid #334155',
    },
    userDropdownName: {
      color: '#f1f5f9',
    },
    userDropdownEmail: {
      color: '#94a3b8',
    },
    userMenuItem: {
      color: '#e2e8f0',
    },
    dropdownDivider: {
      background: '#334155',
    },
    brandName: {
      color: '#f1f5f9',
    },
    userName: {
      color: '#f1f5f9',
    },
  } : {};

  // Merge styles with dark mode
  const getStyles = (baseStyles, darkStyles) => {
    return isDarkMode ? { ...baseStyles, ...darkStyles } : baseStyles;
  };

  return (
    <div style={getStyles(styles.container, darkModeStyles.container)}>
      {/* Left Section */}
      <div style={styles.leftSection}>
        <button 
          onClick={toggleSidebar} 
          style={styles.menuButton}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <FaBars size={20} color={isDarkMode ? '#94a3b8' : '#475569'} />
        </button>

        <div style={styles.brand}>
          <div style={styles.logoIcon}>
            <MdDashboard size={22} color="#4f46e5" />
          </div>
          <div style={styles.brandText}>
            <span style={getStyles(styles.brandName, darkModeStyles.brandName)}>
              Asset<span style={styles.brandHighlight}>Hub</span>
            </span>
            <span style={styles.brandVersion}>v2.0</span>
          </div>
        </div>

        <form onSubmit={handleSearch} style={getStyles(styles.searchWrapper, darkModeStyles.searchWrapper)}>
          <FaSearch size={16} color="#94a3b8" style={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets, tests, reports..."
            style={getStyles(styles.searchInput, darkModeStyles.searchInput)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              style={styles.clearSearch}
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Right Section */}
      <div style={styles.rightSection}>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          style={styles.iconButton}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <FaSun size={18} color="#f59e0b" /> : <FaMoon size={18} color="#64748b" />}
        </button>

        {/* Help Button */}
        <button
          style={styles.iconButton}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Help"
          onClick={() => toast.info('Help documentation coming soon!')}
        >
          <FaQuestionCircle size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
        </button>

        {/* Notifications */}
        <div ref={notificationRef} style={styles.notificationWrapper}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={styles.iconButton}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title="Notifications"
          >
            <FaBell size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
            {unreadCount > 0 && (
              <span style={styles.notificationBadge}>{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div style={getStyles(styles.dropdown, darkModeStyles.dropdown)}>
              <div style={getStyles(styles.dropdownHeader, darkModeStyles.dropdownHeader)}>
                <span style={getStyles(styles.dropdownTitle, darkModeStyles.dropdownTitle)}>Notifications</span>
                <button 
                  style={styles.markAllRead}
                  onClick={() => toast.success('All notifications marked as read')}
                >
                  Mark all read
                </button>
              </div>
              <div style={styles.notificationList}>
                {notifications.length === 0 ? (
                  <div style={styles.emptyNotifications}>
                    <span style={styles.emptyIcon}>🔔</span>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} style={{
                      ...getStyles(styles.notificationItem, darkModeStyles.notificationItem),
                      opacity: notif.read ? 0.6 : 1,
                      background: notif.read ? 'transparent' : (isDarkMode ? '#1e293b' : '#f0f4ff')
                    }}>
                      <span style={styles.notificationIcon}>
                        {getNotificationIcon(notif.type)}
                      </span>
                      <div style={styles.notificationContent}>
                        <span style={getStyles(styles.notificationTitle, darkModeStyles.notificationTitle)}>
                          {notif.title}
                        </span>
                        <span style={getStyles(styles.notificationTime, darkModeStyles.notificationTime)}>
                          {notif.time}
                        </span>
                      </div>
                      {!notif.read && <span style={styles.unreadDot}></span>}
                    </div>
                  ))
                )}
              </div>
              <div style={styles.dropdownFooter}>
                <button style={styles.viewAllBtn}>View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          style={styles.iconButton}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Settings"
        >
          <FaCog size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
        </button>

        {/* User Menu */}
        <div ref={userMenuRef} style={styles.userMenuWrapper}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={styles.userButton}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={styles.userAvatar}>
              {userName ? getInitials(userName) : 'U'}
            </div>
            <span style={getStyles(styles.userName, darkModeStyles.userName)}>
              {userName || 'User'}
            </span>
            <FaChevronDown 
              size={12} 
              color="#94a3b8" 
              style={{
                ...styles.chevron,
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            />
          </button>

          {showUserMenu && (
            <div style={getStyles(styles.userDropdown, darkModeStyles.userDropdown)}>
              <div style={styles.userDropdownHeader}>
                <div style={styles.userDropdownAvatar}>
                  {userName ? getInitials(userName) : 'U'}
                </div>
                <div style={styles.userDropdownInfo}>
                  <span style={getStyles(styles.userDropdownName, darkModeStyles.userDropdownName)}>
                    {userName || 'User'}
                  </span>
                  <span style={getStyles(styles.userDropdownEmail, darkModeStyles.userDropdownEmail)}>
                    admin@example.com
                  </span>
                </div>
              </div>
              
              <div style={getStyles(styles.dropdownDivider, darkModeStyles.dropdownDivider)} />
              
              <div style={styles.userMenuItems}>
                <div style={getStyles(styles.userMenuItem, darkModeStyles.userMenuItem)} 
                     onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                  <FaUserCog size={16} color={isDarkMode ? '#94a3b8' : '#475569'} />
                  <span>My Profile</span>
                </div>
                <div style={getStyles(styles.userMenuItem, darkModeStyles.userMenuItem)} 
                     onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                  <FaCog size={16} color={isDarkMode ? '#94a3b8' : '#475569'} />
                  <span>Settings</span>
                </div>
                <div style={getStyles(styles.userMenuItem, darkModeStyles.userMenuItem)} 
                     onClick={() => { navigate('/dashboard'); setShowUserMenu(false); }}>
                  <MdDashboard size={16} color={isDarkMode ? '#94a3b8' : '#475569'} />
                  <span>Dashboard</span>
                </div>
                <div style={getStyles(styles.userMenuItem, darkModeStyles.userMenuItem)} 
                     onClick={() => { navigate('/assets'); setShowUserMenu(false); }}>
                  <FaDatabase size={16} color={isDarkMode ? '#94a3b8' : '#475569'} />
                  <span>Assets</span>
                </div>
              </div>
              
              <div style={getStyles(styles.dropdownDivider, darkModeStyles.dropdownDivider)} />
              
              <div style={getStyles(styles.userMenuItem, darkModeStyles.userMenuItem)} onClick={handleLogout}>
                <FaSignOutAlt size={16} color="#ef4444" />
                <span style={{ color: '#ef4444' }}>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: 'white',
    padding: '12px 24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid #f1f5f9',
    minHeight: '68px',
    transition: 'all 0.3s ease',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginRight: '16px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    background: '#eef2ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    transition: 'color 0.3s ease',
  },
  brandHighlight: {
    color: '#4f46e5',
  },
  brandVersion: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '400',
    letterSpacing: '0.3px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    borderRadius: '10px',
    padding: '0 14px',
    flex: 1,
    maxWidth: '400px',
    border: '1px solid #f1f5f9',
    transition: 'all 0.3s ease',
  },
  searchIcon: {
    marginRight: '10px',
  },
  searchInput: {
    flex: 1,
    padding: '9px 0',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    background: 'transparent',
    color: '#0f172a',
    transition: 'color 0.3s ease',
  },
  clearSearch: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px 8px',
    fontSize: '14px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  iconButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  notificationBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    background: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    padding: '1px 5px',
    borderRadius: '50%',
    minWidth: '18px',
    textAlign: 'center',
  },
  notificationWrapper: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '48px',
    right: '0',
    width: '360px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    zIndex: 1000,
    transition: 'all 0.3s ease',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #f1f5f9',
  },
  dropdownTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
  },
  markAllRead: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  notificationList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  emptyNotifications: {
    padding: '32px',
    textAlign: 'center',
    color: '#94a3b8',
  },
  emptyIcon: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '8px',
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    borderBottom: '1px solid #f8fafc',
  },
  notificationIcon: {
    fontSize: '20px',
  },
  notificationContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  notificationTitle: {
    fontSize: '13px',
    color: '#0f172a',
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    background: '#4f46e5',
    borderRadius: '50%',
    flexShrink: 0,
  },
  dropdownFooter: {
    padding: '12px 18px',
    borderTop: '1px solid #f1f5f9',
    textAlign: 'center',
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  userMenuWrapper: {
    position: 'relative',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 12px 4px 4px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
    transition: 'color 0.3s ease',
  },
  chevron: {
    transition: 'transform 0.2s',
  },
  userDropdown: {
    position: 'absolute',
    top: '48px',
    right: '0',
    width: '280px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    zIndex: 1000,
    transition: 'all 0.3s ease',
  },
  userDropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 18px',
  },
  userDropdownAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  userDropdownInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userDropdownName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
  },
  userDropdownEmail: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  dropdownDivider: {
    height: '1px',
    background: '#f1f5f9',
    margin: '0 12px',
  },
  userMenuItems: {
    padding: '4px 0',
  },
  userMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 18px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    color: '#0f172a',
  },
};

export default TopBar;
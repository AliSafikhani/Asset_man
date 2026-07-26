// frontend/src/components/AssetDetail/common/TabNavigation.jsx
import React, { useRef, useState, useEffect } from 'react';

const TabNavigation = ({ tabs, activeId, onSelect, scrollable = true }) => {
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrows = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [tabs]);

  const scroll = (direction) => {
    const container = containerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    const target = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handleTabClick = (id) => {
    onSelect(id);
    const container = containerRef.current;
    if (!container) return;
    const tabElement = container.querySelector(`[data-tab-id="${id}"]`);
    if (tabElement) {
      tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  if (!scrollable) {
    return (
      <div style={styles.container}>
        <div style={styles.tabsWrapper}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              style={{
                ...styles.tab,
                ...(activeId === tab.id ? styles.activeTab : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.navWrapper}>
        {showLeftArrow && (
          <button onClick={() => scroll('left')} style={styles.arrowButton} aria-label="Scroll tabs left">
            ‹
          </button>
        )}
        <div ref={containerRef} style={styles.scrollContainer} onScroll={updateArrows}>
          <div style={styles.tabsWrapper}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => handleTabClick(tab.id)}
                style={{
                  ...styles.tab,
                  ...(activeId === tab.id ? styles.activeTab : {}),
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {showRightArrow && (
          <button onClick={() => scroll('right')} style={styles.arrowButton} aria-label="Scroll tabs right">
            ›
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '20px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '4px',
  },
  navWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    padding: '2px 0',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  tabsWrapper: {
    display: 'flex',
    gap: '4px',
    whiteSpace: 'nowrap',
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569', // darker (was #64748b)
    borderRadius: '6px',
    transition: 'all 0.2s',
    flexShrink: 0,
    outline: 'none',
    '&:hover': {
      background: '#f1f5f9',
    },
  },
  activeTab: {
    background: '#667eea',
    color: 'white',
    boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
    '&:hover': {
      background: '#5a6fd6',
    },
  },
  arrowButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '20px',
    color: '#475569',
    flexShrink: 0,
    margin: '0 4px',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f1f5f9',
      borderColor: '#cbd5e1',
    },
    '&:active': {
      transform: 'scale(0.95)',
    },
  },
};

export default TabNavigation;
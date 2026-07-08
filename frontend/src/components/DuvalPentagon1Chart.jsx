// frontend/src/components/DuvalPentagon1Chart.jsx

import React, { useEffect, useRef, useState } from 'react';
import { FaChartPie, FaInfoCircle, FaDownload, FaExpand, FaCompress } from 'react-icons/fa';

const DuvalPentagon1Chart = ({ data, width = 650, height = 600 }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const renderTimeoutRef = useRef(null);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipDataState, setTooltipDataState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      renderChart();
    }, 100);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [data, width, height]);

  const renderChart = async () => {
    try {
      const svg = svgRef.current;
      if (!svg) return;
      
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      const d3Module = await import('d3');
      const d3 = d3Module.default || d3Module;
      
      renderWithD3(d3, svg);
      setRenderError(null);
    } catch (err) {
      console.error('Error rendering Duval Pentagon 1 chart:', err);
      setRenderError(err.message);
    }
  };

  const renderWithD3 = (d3, svg) => {
    try {
      const margin = { top: 50, right: 50, bottom: 60, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svgElement = d3.select(svg)
        .attr('width', width)
        .attr('height', height)
        .style('background', '#ffffff')
        .style('border-radius', '12px')
        .style('cursor', 'grab');

      // Remove existing zoom
      svgElement.on('.zoom', null);
      svgElement.on('dblclick.zoom', null);
      svgElement.on('wheel.zoom', null);

      // Add subtle background gradient
      const defs = svgElement.append('defs');
      
      const gradient = defs.append('linearGradient')
        .attr('id', 'bgGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#f8fafc')
        .attr('stop-opacity', 1);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#f1f5f9')
        .attr('stop-opacity', 1);

      svgElement.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'url(#bgGradient)')
        .attr('rx', 12)
        .attr('ry', 12);

      const g = svgElement.append('g')
        .attr('class', 'chart-group')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Define pentagon zones
      const zones = [
        {
          id: 'PD',
          color: '#FF6B6B',
          centroid: { x: -0.5, y: 28 },
          points: [[0, 33], [-1, 33], [-1, 24.5], [0, 24.5]],
          description: 'Partial Discharge'
        },
        {
          id: 'S',
          color: '#A8E6CF',
          centroid: { x: -15, y: 18 },
          points: [[0, 1.5], [-35, 3.1], [-38, 12.4], [0, 40], [0, 24.5]],
          description: 'Stray Gassing'
        },
        {
          id: 'T1',
          color: '#4ECDC4',
          centroid: { x: -18, y: -10 },
          points: [[-6, -4], [-22.5, -32.4], [-23.5, -32.4], [-35, 3], [0, 1.5], [0, -3]],
          description: 'Thermal Fault < 300°C'
        },
        {
          id: 'T2',
          color: '#45B7D1',
          centroid: { x: -10, y: -22 },
          points: [[-6, -4], [1, -32.4], [-22.5, -32.4]],
          description: 'Thermal Fault 300-700°C'
        },
        {
          id: 'T3',
          color: '#96CEB4',
          centroid: { x: 10, y: -22 },
          points: [[0, -3], [24.3, -30], [23.5, -32.4], [1, -32.4], [-6, -4]],
          description: 'Thermal Fault > 700°C'
        },
        {
          id: 'D1',
          color: '#FFEAA7',
          centroid: { x: 20, y: 18 },
          points: [[0, 40], [38, 12.4], [32, -6.1], [4, 16], [0, 1.5]],
          description: 'Low Energy Discharge'
        },
        {
          id: 'D2',
          color: '#DDA0DD',
          centroid: { x: 15, y: -8 },
          points: [[4, 16], [32, -6.1], [24.3, -30], [0, -3], [0, 1.5]],
          description: 'High Energy Discharge'
        }
      ];

      // Calculate bounds
      const allX = zones.flatMap(z => z.points.map(p => p[0]));
      const allY = zones.flatMap(z => z.points.map(p => p[1]));
      const minX = Math.min(...allX) - 5;
      const maxX = Math.max(...allX) + 5;
      const minY = Math.min(...allY) - 5;
      const maxY = Math.max(...allY) + 5;

      const xScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([innerHeight, 0]);

      // Draw zones
      zones.forEach((zone) => {
        const polygonPath = d3.line()
          .x(d => xScale(d[0]))
          .y(d => yScale(d[1]))
          .curve(d3.curveLinearClosed);

        const path = g.append('path')
          .datum(zone.points)
          .attr('d', polygonPath)
          .attr('fill', zone.color)
          .attr('fill-opacity', 0.35)
          .attr('stroke', zone.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.5)
          .style('cursor', 'pointer');

        path.on('mouseover', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 0.55)
            .attr('stroke-width', 2.5);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 0.35)
            .attr('stroke-width', 1.5);
        });
      });

      // Draw pentagon outline
      const pentagonPoints = [
        [0, 40], [38, 12.4], [23.5, -32.4],
        [1, -32.4], [-23.5, -32.4], [-38, 12.4], [0, 40]
      ];

      const pentagonPath = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]))
        .curve(d3.curveLinearClosed);

      // Glow effect
      g.append('path')
        .datum(pentagonPoints)
        .attr('d', pentagonPath)
        .attr('fill', 'none')
        .attr('stroke', '#4f46e5')
        .attr('stroke-width', 4)
        .attr('opacity', 0.12);

      // Main pentagon outline
      g.append('path')
        .datum(pentagonPoints)
        .attr('d', pentagonPath)
        .attr('fill', 'none')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 2.5)
        .style('stroke-dasharray', '4,2')
        .style('opacity', 0.3);

      // Zone Labels
      zones.forEach(zone => {
        const labelGroup = g.append('g')
          .style('cursor', 'default');

        labelGroup.append('rect')
          .attr('x', xScale(zone.centroid.x) - 28)
          .attr('y', yScale(zone.centroid.y) - 14)
          .attr('width', 56)
          .attr('height', 28)
          .attr('fill', 'white')
          .attr('rx', 14)
          .style('opacity', 0.9)
          .style('stroke', zone.color)
          .style('stroke-width', 2);

        labelGroup.append('text')
          .attr('x', xScale(zone.centroid.x))
          .attr('y', yScale(zone.centroid.y) + 4)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '11px')
          .style('font-weight', '700')
          .style('fill', '#1e293b')
          .text(zone.id);
      });

      // Color scale for data points
      const colorScale = d3.scaleOrdinal()
        .domain(['PD', 'S', 'T1', 'T2', 'T3', 'D1', 'D2', 'ND'])
        .range(['#FF6B6B', '#A8E6CF', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#90A4AE']);

      // Filter valid data
      const validData = data.filter(d => 
        d.coordinates && 
        typeof d.coordinates.x === 'number' && 
        typeof d.coordinates.y === 'number' &&
        !isNaN(d.coordinates.x) &&
        !isNaN(d.coordinates.y)
      );

      if (validData.length === 0) {
        g.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight / 2)
          .attr('text-anchor', 'middle')
          .style('font-size', '16px')
          .style('fill', '#94a3b8')
          .text('No valid data points to display');
        return;
      }

      // Draw data points with glow effect
      validData.forEach((d) => {
        const cx = xScale(d.coordinates.x);
        const cy = yScale(d.coordinates.y);
        const zone = d.fault_zone || 'ND';
        const fillColor = colorScale(zone);

        // Glow
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 14)
          .attr('fill', fillColor)
          .attr('opacity', 0.15)
          .attr('pointer-events', 'none');

        // Main circle
        const circle = g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 8)
          .attr('fill', fillColor)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2.5)
          .style('cursor', 'pointer')
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

        circle.on('mouseover', function(event) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 12)
            .attr('stroke-width', 3);

          const date = d.sample_date ? new Date(d.sample_date).toLocaleDateString() : 'N/A';
          const tooltipData = {
            date,
            zone,
            faultName: d.fault_name || 'Unknown',
            percentages: d.percentages || {}
          };
          
          const tooltipEvent = new CustomEvent('pointHover', {
            detail: {
              data: tooltipData,
              position: { x: event.pageX, y: event.pageY }
            }
          });
          document.dispatchEvent(tooltipEvent);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 8)
            .attr('stroke-width', 2.5);
          
          const tooltipEvent = new CustomEvent('pointHover', {
            detail: null
          });
          document.dispatchEvent(tooltipEvent);
        });
      });

      // Legend
      const legend = g.append('g')
        .attr('transform', `translate(${innerWidth - 160}, 10)`);

      legend.append('rect')
        .attr('width', 150)
        .attr('height', 190)
        .attr('fill', 'white')
        .attr('opacity', 0.95)
        .attr('rx', 10)
        .style('stroke', '#e2e8f0')
        .style('stroke-width', 1);

      legend.append('text')
        .attr('x', 75)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '700')
        .style('fill', '#1e293b')
        .text('Legend');

      const legendData = [
        { zone: 'PD', label: 'PD - Partial Discharge' },
        { zone: 'S', label: 'S - Stray Gassing' },
        { zone: 'T1', label: 'T1 (<300 C)' },
        { zone: 'T2', label: 'T2 (300-700 C)' },
        { zone: 'T3', label: 'T3 (>700 C)' },
        { zone: 'D1', label: 'D1 (Low Energy)' },
        { zone: 'D2', label: 'D2 (High Energy)' },
        { zone: 'ND', label: 'ND - Not Determined' },
      ];

      legendData.forEach((item, i) => {
        const row = legend.append('g')
          .attr('transform', `translate(10, ${30 + i * 19})`);

        row.append('rect')
          .attr('width', 14)
          .attr('height', 14)
          .attr('fill', colorScale(item.zone))
          .attr('rx', 4);

        row.append('text')
          .attr('x', 22)
          .attr('y', 12)
          .style('font-size', '10px')
          .style('fill', '#475569')
          .text(item.label);
      });

      // ============================================
      // ZOOM FUNCTIONALITY
      // ============================================
      
      const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .extent([[0, 0], [width, height]])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
          const newZoom = Math.round(event.transform.k * 100) / 100;
          setZoomLevel(newZoom);
          svgElement.style('cursor', event.transform.k === 1 ? 'grab' : 'grab');
        });

      svgElement.call(zoom);
      svgElement.call(zoom.transform, d3.zoomIdentity);

      svgElement.on('dblclick', () => {
        svgElement.transition()
          .duration(500)
          .call(zoom.transform, d3.zoomIdentity);
      });

    } catch (err) {
      console.error('Error rendering with d3:', err);
      throw err;
    }
  };

  // Tooltip event listener
  useEffect(() => {
    const handlePointHover = (event) => {
      if (event.detail) {
        setTooltipVisible(true);
        setTooltipDataState(event.detail.data);
        setTooltipPos(event.detail.position);
      } else {
        setTooltipVisible(false);
        setTooltipDataState(null);
      }
    };

    document.addEventListener('pointHover', handlePointHover);
    return () => {
      document.removeEventListener('pointHover', handlePointHover);
    };
  }, []);

  const handleResetZoom = () => {
    const svg = svgRef.current;
    if (!svg) return;
    
    import('d3').then(d3Module => {
      const d3 = d3Module.default || d3Module;
      const svgElement = d3.select(svg);
      const zoom = d3.zoom().on('zoom', null);
      svgElement.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
    });
  };

  const PointTooltip = ({ visible, data, position }) => {
    if (!visible || !data) return null;

    return (
      <div style={{
        position: 'fixed',
        left: position.x + 15,
        top: position.y - 10,
        background: 'white',
        padding: '14px 18px',
        borderRadius: '10px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        zIndex: 1000,
        minWidth: '200px',
        maxWidth: '280px',
        pointerEvents: 'none',
        animation: 'fadeIn 0.15s ease'
      }}>
        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>
          {data.date}
        </div>
        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '2px' }}>
          Zone: <span style={{ fontWeight: '600' }}>{data.zone}</span>
        </div>
        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
          Fault: <span style={{ fontWeight: '600' }}>{data.faultName}</span>
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Gas Percentages:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
            {Object.entries(data.percentages || {}).slice(0, 4).map(([key, value]) => (
              <div key={key} style={{ fontSize: '12px', color: '#1e293b', fontWeight: '500' }}>
                {key}: <span style={{ fontWeight: '400', color: '#64748b' }}>{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div style={styles.noDataContainer}>
        <div style={styles.noDataIcon}>📊</div>
        <h3>No Duval Pentagon 1 Data Available</h3>
        <p>Please run DGA analysis to see the chart</p>
      </div>
    );
  }

  if (renderError) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h4>Error loading chart</h4>
        <p>{renderError}</p>
      </div>
    );
  }

  return (
    <div style={styles.container} ref={containerRef}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <FaChartPie size={20} color="#4f46e5" />
          <span style={styles.headerTitle}>Duval Pentagon 1</span>
          <span style={styles.headerBadge}>{data.length} Points</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.zoomInfo}>Zoom: {zoomLevel}x</span>
          <button style={styles.resetButton} onClick={handleResetZoom}>
            🔄 Reset View
          </button>
          <button 
            style={styles.iconButton} 
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
          </button>
        </div>
      </div>
      
      <div style={{ 
        ...styles.chartWrapper,
        ...(isFullscreen ? styles.fullscreen : {})
      }}>
        <svg ref={svgRef} width={width} height={height} />
      </div>
      
      <PointTooltip 
        visible={tooltipVisible} 
        data={tooltipDataState} 
        position={tooltipPos} 
      />
      
      <div style={styles.footer}>
        <span style={styles.footerText}>🖱️ Scroll to zoom</span>
        <span style={styles.footerText}>🔄 Drag to pan</span>
        <span style={styles.footerText}>📌 Double-click to reset</span>
        <span style={styles.footerText}>💡 Hover points for details</span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #f1f5f9',
    background: '#fafafa',
    flexWrap: 'wrap',
    gap: '8px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
  },
  headerBadge: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#4f46e5',
    background: '#eef2ff',
    padding: '2px 10px',
    borderRadius: '12px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  zoomInfo: {
    fontSize: '12px',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 10px',
    borderRadius: '12px',
  },
  resetButton: {
    fontSize: '12px',
    padding: '4px 12px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  chartWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '8px',
    overflowX: 'auto',
    background: '#ffffff',
    transition: 'all 0.3s ease',
  },
  fullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    background: '#ffffff',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    padding: '10px 20px',
    borderTop: '1px solid #f1f5f9',
    background: '#fafafa',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    textAlign: 'center',
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#ef4444',
  },
  errorIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
};

export default DuvalPentagon1Chart;
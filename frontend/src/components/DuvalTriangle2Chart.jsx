// frontend/src/components/DuvalTriangle2Chart.jsx

import React, { useEffect, useRef, useState } from 'react';

const DuvalTriangle2Chart = ({ data, width = 650, height = 600 }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [renderError, setRenderError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const renderTimeoutRef = useRef(null);

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
      console.error('Error rendering Duval Triangle 2 chart:', err);
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
        .style('border-radius', '8px')
        .style('cursor', 'grab');

      // Remove existing zoom
      svgElement.on('.zoom', null);
      svgElement.on('dblclick.zoom', null);
      svgElement.on('wheel.zoom', null);

      const g = svgElement.append('g')
        .attr('class', 'chart-group')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const sin60 = Math.sin(Math.PI / 3);
      
      const vertices = [
        { x: 0, y: 0, label: 'CH4' },
        { x: 10, y: 0, label: 'C2H4' },
        { x: 5, y: 10 * sin60, label: 'C2H2' }
      ];

      const xScale = d3.scaleLinear()
        .domain([-0.5, 10.5])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([-0.5, 10 * sin60 + 0.5])
        .range([innerHeight, 0]);

      // Define zones with proper point arrays
      const zones = [
        {
          id: 'N', color: '#4CAF50',
          centroid: { x: 1.5, y: 1.0 * sin60 },
          points: [
            [0.6 + (0.2 * Math.cos(Math.PI/3)), 0.2 * sin60],
            [2.3 + (0.2 * Math.cos(Math.PI/3)), 0.2 * sin60],
            [2.3 + (1.9 * Math.cos(Math.PI/3)), 1.9 * sin60],
            [0.6 + (1.9 * Math.cos(Math.PI/3)), 1.9 * sin60],
            [0.6 + (0.2 * Math.cos(Math.PI/3)), 0.2 * sin60]
          ]
        },
        {
          id: 'T3', color: '#96CEB4',
          centroid: { x: 9.0, y: 1.5 * sin60 },
          points: [
            [8.5, 0],
            [10, 0],
            [10 - (5 * Math.cos(Math.PI/3)), 5 * sin60],
            [5 + (3.5 * Math.cos(Math.PI/3)), 3.5 * sin60],
            [8.5, 0]
          ]
        },
        {
          id: 'X3', color: '#FFD93D',
          centroid: { x: 6.0, y: 2.0 * sin60 },
          points: [
            [2.3, 0],
            [8.5, 0],
            [2.3 + (6.2 * Math.cos(Math.PI/3)), 6.2 * sin60],
            [2.3, 0]
          ]
        },
        {
          id: 'T2', color: '#45B7D1',
          centroid: { x: 7.0, y: 4.5 * sin60 },
          points: [
            [5 + (3.5 * Math.cos(Math.PI/3)), 3.5 * sin60],
            [10 - (5 * Math.cos(Math.PI/3)), 5 * sin60],
            [10 - (7.7 * Math.cos(Math.PI/3)), 7.7 * sin60],
            [2.3 + (6.2 * Math.cos(Math.PI/3)), 6.2 * sin60],
            [5 + (3.5 * Math.cos(Math.PI/3)), 3.5 * sin60]
          ]
        },
        {
          id: 'D1', color: '#FFEAA7',
          centroid: { x: 1.0, y: 3.5 * sin60 },
          points: [
            [0, 0],
            [2.3, 0],
            [2.3 + (0.2 * Math.cos(Math.PI/3)), 0.2 * sin60],
            [0.6 + (0.2 * Math.cos(Math.PI/3)), 0.2 * sin60],
            [0.6 + (1.9 * Math.cos(Math.PI/3)), 1.9 * sin60],
            [1.9 * Math.cos(Math.PI/3), 1.9 * sin60],
            [0, 0]
          ]
        },
        {
          id: 'X1', color: '#FF6B6B',
          centroid: { x: 3.5, y: 6.0 * sin60 },
          points: [
            [1.9 * Math.cos(Math.PI/3), 1.9 * sin60],
            [2.3 + (1.9 * Math.cos(Math.PI/3)), 1.9 * sin60],
            [10 - (7.7 * Math.cos(Math.PI/3)), 7.7 * sin60],
            [5, 10 * sin60],
            [1.9 * Math.cos(Math.PI/3), 1.9 * sin60]
          ]
        }
      ];

      // Draw zones
      zones.forEach(zone => {
        const polygonPath = d3.line()
          .x(d => xScale(d[0]))
          .y(d => yScale(d[1]))
          .curve(d3.curveLinearClosed);

        g.append('path')
          .datum(zone.points)
          .attr('d', polygonPath)
          .attr('fill', zone.color)
          .attr('fill-opacity', 0.35)
          .attr('stroke', zone.color)
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.5);
      });

      // Draw triangle outline
      const trianglePoints = vertices.map(v => [v.x, v.y]);
      const trianglePath = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));

      g.append('path')
        .datum([...trianglePoints, trianglePoints[0]])
        .attr('d', trianglePath)
        .attr('fill', 'none')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 2.5);

      // Zone Labels
      zones.forEach(zone => {
        g.append('rect')
          .attr('x', xScale(zone.centroid.x) - 22)
          .attr('y', yScale(zone.centroid.y) - 12)
          .attr('width', 44)
          .attr('height', 24)
          .attr('fill', 'white')
          .attr('rx', 4)
          .style('opacity', 0.85)
          .style('stroke', '#ddd')
          .style('stroke-width', 0.5);

        g.append('text')
          .attr('x', xScale(zone.centroid.x))
          .attr('y', yScale(zone.centroid.y) + 4)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', '#1e293b')
          .text(zone.id);
      });

      // Vertex Labels
      const vertexLabels = [
        { x: 0, y: -0.8, label: 'CH₄' },
        { x: 10, y: -0.8, label: 'C₂H₄' },
        { x: 5, y: 10 * sin60 + 0.8, label: 'C₂H₂' }
      ];

      vertexLabels.forEach(v => {
        g.append('text')
          .attr('x', xScale(v.x))
          .attr('y', yScale(v.y))
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '13px')
          .style('font-weight', 'bold')
          .style('fill', '#0f172a')
          .text(v.label);
      });

      // Color scale for data points
      const colorScale = d3.scaleOrdinal()
        .domain(['N', 'T3', 'X3', 'T2', 'D1', 'X1', 'UNK'])
        .range(['#4CAF50', '#96CEB4', '#FFD93D', '#45B7D1', '#FFEAA7', '#FF6B6B', '#95A5A6']);

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
          .attr('x', xScale(5))
          .attr('y', yScale(5 * sin60))
          .style('font-size', '14px')
          .style('fill', '#999')
          .text('No valid data points');
        return;
      }

      // Draw data points with glow effect
      validData.forEach((d) => {
        const cx = xScale(d.coordinates.x);
        const cy = yScale(d.coordinates.y);
        const zone = d.fault_zone || 'UNK';
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
          .attr('stroke', '#fff')
          .attr('stroke-width', 2.5)
          .style('cursor', 'pointer')
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

        circle.on('mouseover', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 12)
            .attr('stroke-width', 3);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 8)
            .attr('stroke-width', 2.5);
        });

        const date = d.sample_date ? new Date(d.sample_date).toLocaleDateString() : 'N/A';
        circle.append('title')
          .text(`Date: ${date}\nZone: ${zone}\nFault: ${d.fault_name || 'Unknown'}`);
      });

      // Legend
      const legend = g.append('g')
        .attr('transform', `translate(${innerWidth - 150}, 10)`);

      legend.append('rect')
        .attr('width', 140)
        .attr('height', 160)
        .attr('fill', 'white')
        .attr('opacity', 0.9)
        .attr('rx', 8)
        .style('stroke', '#ddd')
        .style('stroke-width', 1);

      const legendData = [
        { zone: 'N', label: 'N - Normal' },
        { zone: 'T3', label: 'T3 (>700 C)' },
        { zone: 'X3', label: 'X3 - Unknown' },
        { zone: 'T2', label: 'T2 (300-700 C)' },
        { zone: 'D1', label: 'D1 (Low Energy)' },
        { zone: 'X1', label: 'X1 - Unknown' },
      ];

      legendData.forEach((item, i) => {
        const row = legend.append('g')
          .attr('transform', `translate(8, ${12 + i * 18})`);

        row.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', colorScale(item.zone))
          .attr('rx', 2);

        row.append('text')
          .attr('x', 18)
          .attr('y', 10)
          .style('font-size', '10px')
          .style('fill', '#333')
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

  if (!data || data.length === 0) {
    return (
      <div style={styles.noDataContainer}>
        <div style={styles.noDataIcon}>📊</div>
        <h3>No Duval Triangle 2 Data Available</h3>
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
          <span style={styles.headerIcon}>📐</span>
          <span style={styles.headerTitle}>Duval Triangle 2</span>
          <span style={styles.headerBadge}>{data.length} Points</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.zoomInfo}>Zoom: {zoomLevel}x</span>
          <button style={styles.resetButton} onClick={handleResetZoom}>
            🔄 Reset View
          </button>
        </div>
      </div>
      <div style={styles.chartWrapper}>
        <svg ref={svgRef} width={width} height={height} />
      </div>
      <div style={styles.footer}>
        <span>🖱️ Scroll to zoom</span>
        <span>🔄 Drag to pan</span>
        <span>📌 Double-click to reset</span>
        <span>💡 Hover points for details</span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
    flexWrap: 'wrap',
    gap: '8px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerIcon: {
    fontSize: '18px',
  },
  headerTitle: {
    fontSize: '15px',
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
    gap: '10px',
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
    ':hover': {
      background: '#4338ca',
    },
  },
  chartWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '8px',
    overflow: 'hidden',
    background: '#ffffff',
    position: 'relative',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    padding: '8px 16px',
    borderTop: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: '12px',
    color: '#94a3b8',
    flexWrap: 'wrap',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
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

export default DuvalTriangle2Chart;
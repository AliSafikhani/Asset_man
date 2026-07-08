// frontend/src/components/DuvalPentagon2Chart.jsx

import React, { useEffect, useRef, useState } from 'react';

const DuvalPentagon2Chart = ({ data, width = 650, height = 600 }) => {
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
      console.error('Error rendering Duval Pentagon 2 chart:', err);
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

      // Define pentagon zones for Pentagon 2
      const zones = [
        {
          id: 'PD',
          color: '#FF6B6B',
          points: [[0, 33], [-1, 33], [-1, 24.5], [0, 24.5]]
        },
        {
          id: 'S',
          color: '#A8E6CF',
          points: [[0, 1.5], [-35, 3.1], [-38, 12.4], [0, 40], [0, 24.5]]
        },
        {
          id: 'O',
          color: '#FFB74D',
          points: [[-3.5, -3], [-11, -8], [-21.5, -32.4], [-23.5, -32.4], [-35, 3.1], [0, 1.5], [0, -3]]
        },
        {
          id: 'C',
          color: '#A1887F',
          points: [[-3.5, -3], [2.5, -32.4], [-21.5, -32.4], [-11, -8]]
        },
        {
          id: 'T3H',
          color: '#96CEB4',
          points: [[0, -3], [24.3, -30], [23.5, -32.4], [2.5, -32.4], [-3.5, -3]]
        },
        {
          id: 'D1',
          color: '#FFEAA7',
          points: [[0, 40], [38, 12.4], [32, -6.1], [4, 16], [0, 1.5]]
        },
        {
          id: 'D2',
          color: '#DDA0DD',
          points: [[4, 16], [32, -6.1], [24.3, -30], [0, -3], [0, 1.5]]
        }
      ];

      // Calculate bounds
      const allX = zones.flatMap(z => z.points.map(p => p[0]));
      const allY = zones.flatMap(z => z.points.map(p => p[1]));
      const minX = Math.min(...allX) - 10;
      const maxX = Math.max(...allX) + 10;
      const minY = Math.min(...allY) - 10;
      const maxY = Math.max(...allY) + 10;

      const xScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([innerHeight, 0]);

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

      // Draw pentagon outline
      const pentagonPoints = [
        [0, 40], [38, 12.4], [23.5, -32.4],
        [1, -32.4], [-23.5, -32.4], [-38, 12.4], [0, 40]
      ];

      const pentagonPath = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]))
        .curve(d3.curveLinearClosed);

      g.append('path')
        .datum(pentagonPoints)
        .attr('d', pentagonPath)
        .attr('fill', 'none')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 2.5);

      // Draw internal boundary lines
      const boundaryLines = [
        [[0, 24.5], [-1, 24.5]],
        [[0, 40], [38, 12.4]],
        [[0, 1.5], [-35, 3.1]],
        [[-3.5, -3], [-21.5, -32.4]],
        [[-3.5, -3], [2.5, -32.4]],
        [[0, -3], [24.3, -30]],
        [[4, 16], [32, -6.1]],
        [[0, 1.5], [4, 16]],
      ];

      boundaryLines.forEach(line => {
        g.append('line')
          .attr('x1', xScale(line[0][0]))
          .attr('y1', yScale(line[0][1]))
          .attr('x2', xScale(line[1][0]))
          .attr('y2', yScale(line[1][1]))
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 0.8)
          .attr('stroke-dasharray', '4,4');
      });

      // Zone Labels
      const zoneLabels = [
        { id: 'PD', x: -0.5, y: 28 },
        { id: 'S', x: -15, y: 18 },
        { id: 'O', x: -15, y: -5 },
        { id: 'C', x: -10, y: -18 },
        { id: 'T3H', x: 10, y: -18 },
        { id: 'D1', x: 20, y: 18 },
        { id: 'D2', x: 15, y: -5 }
      ];

      zoneLabels.forEach(label => {
        const labelGroup = g.append('g');

        labelGroup.append('rect')
          .attr('x', xScale(label.x) - 22)
          .attr('y', yScale(label.y) - 12)
          .attr('width', 44)
          .attr('height', 24)
          .attr('fill', 'white')
          .attr('rx', 4)
          .style('opacity', 0.85)
          .style('stroke', '#ddd')
          .style('stroke-width', 0.5);

        labelGroup.append('text')
          .attr('x', xScale(label.x))
          .attr('y', yScale(label.y) + 4)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .style('fill', '#1e293b')
          .text(label.id);
      });

      // Color scale for data points
      const colorScale = d3.scaleOrdinal()
        .domain(['PD', 'S', 'O', 'C', 'T3H', 'D1', 'D2', 'NA'])
        .range(['#FF6B6B', '#A8E6CF', '#FFB74D', '#A1887F', '#96CEB4', '#FFEAA7', '#DDA0DD', '#E0E0E0']);

      // Filter valid data
      const validData = data.filter(d => 
        d.coordinates && 
        typeof d.coordinates.x === 'number' && 
        typeof d.coordinates.y === 'number' &&
        !isNaN(d.coordinates.x) &&
        !isNaN(d.coordinates.y) &&
        d.fault_zone !== 'NA'
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
        .attr('transform', `translate(${innerWidth - 140}, 10)`);

      legend.append('rect')
        .attr('width', 130)
        .attr('height', 170)
        .attr('fill', 'white')
        .attr('opacity', 0.9)
        .attr('rx', 8)
        .style('stroke', '#ddd')
        .style('stroke-width', 1);

      const legendData = [
        { zone: 'PD', label: 'PD - Partial Discharge' },
        { zone: 'S', label: 'S - Stray Gassing' },
        { zone: 'O', label: 'O - Overheating <250' },
        { zone: 'C', label: 'C - Carbonization' },
        { zone: 'T3H', label: 'T3H - T3 Hot Spot' },
        { zone: 'D1', label: 'D1 (Low Energy)' },
        { zone: 'D2', label: 'D2 (High Energy)' },
        { zone: 'NA', label: 'NA - Not Applicable' },
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
          .style('font-size', '9px')
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
        <h3>No Duval Pentagon 2 Data Available</h3>
        <p>Only applies when Pentagon 1 is T1, T2, or T3</p>
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
          <span style={styles.headerIcon}>⬠</span>
          <span style={styles.headerTitle}>Duval Pentagon 2</span>
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

export default DuvalPentagon2Chart;
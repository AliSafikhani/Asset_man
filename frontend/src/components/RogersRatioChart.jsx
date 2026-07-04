import React, { useEffect, useRef, useState } from 'react';

const RogersRatioChart = ({ data, width = 650, height = 600 }) => {
  const svgRef = useRef();

  useEffect(() => {
    console.log('RogersRatioChart received data:', data);
    console.log('RogersRatioChart data length:', data?.length);

    if (!data || data.length === 0) {
      console.warn('No data for Rogers Ratio chart');
      return;
    }

    const svg = svgRef.current;
    if (!svg) return;

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    try {
      import('d3').then(d3 => {
        renderWithD3(d3, svg);
      }).catch(err => {
        console.error('Failed to load d3:', err);
      });
    } catch (err) {
      console.error('Error:', err);
    }
  }, [data]);

  const renderWithD3 = (d3, svg) => {
    try {
      const margin = { top: 50, right: 50, bottom: 60, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svgElement = d3.select(svg)
        .attr('width', width)
        .attr('height', height);

      const g = svgElement
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Color scale for fault types
      const colorScale = d3.scaleOrdinal()
        .domain(['NL', 'PD', 'ARC', 'T1', 'T2', 'T3', 'UNK'])
        .range(['#4CAF50', '#FF6B6B', '#DDA0DD', '#4ECDC4', '#45B7D1', '#96CEB4', '#95A5A6']);

      // Get valid data points
      const validData = data.filter(d => 
        d.coordinates && 
        typeof d.coordinates.x === 'number' && 
        typeof d.coordinates.y === 'number' &&
        typeof d.coordinates.z === 'number' &&
        !isNaN(d.coordinates.x) &&
        !isNaN(d.coordinates.y) &&
        !isNaN(d.coordinates.z)
      );

      console.log('Valid data points for Rogers chart:', validData.length);

      if (validData.length === 0) {
        g.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight / 2)
          .attr('text-anchor', 'middle')
          .style('font-size', '16px')
          .style('fill', '#999')
          .text('No valid data points (check if gas data has H2, CH4, C2H6, C2H4, C2H2)');
        return;
      }

      // Get the range of values for scaling
      const allX = validData.map(d => d.coordinates.x);
      const allY = validData.map(d => d.coordinates.y);
      const allZ = validData.map(d => d.coordinates.z);
      
      const minX = Math.min(0, ...allX) - 0.5;
      const maxX = Math.max(10, ...allX) + 0.5;
      const minZ = Math.min(0, ...allZ) - 0.5;
      const maxZ = Math.max(10, ...allZ) + 0.5;

      // Create scales (projecting 3D to 2D)
      const xScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([50, innerWidth - 50]);

      const yScale = d3.scaleLinear()
        .domain([minZ, maxZ])
        .range([innerHeight - 50, 50]);

      // Draw axes
      const axisColor = '#333';
      const axisWidth = 2;

      // X-axis (R1)
      g.append('line')
        .attr('x1', 50)
        .attr('y1', yScale(0))
        .attr('x2', innerWidth - 50)
        .attr('y2', yScale(0))
        .attr('stroke', axisColor)
        .attr('stroke-width', axisWidth);

      // Z-axis (R3) - projected as Y axis
      g.append('line')
        .attr('x1', xScale(0))
        .attr('y1', 50)
        .attr('x2', xScale(0))
        .attr('y2', innerHeight - 50)
        .attr('stroke', axisColor)
        .attr('stroke-width', axisWidth);

      // Axis labels
      g.append('text')
        .attr('x', innerWidth - 50)
        .attr('y', yScale(0) - 10)
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .text('R1 (C2H4/C2H6)');

      g.append('text')
        .attr('x', xScale(0) - 10)
        .attr('y', 30)
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .text('R3 (C2H2/C2H4)');

      // Legend for R2 (Y-axis) - shown as circle size
      g.append('text')
        .attr('x', innerWidth - 20)
        .attr('y', 20)
        .style('font-size', '11px')
        .style('fill', '#666')
        .text('R2 = circle size');

      // Draw zone labels
      const zoneLabels = [
        { id: 'NL', x: 0.5, z: 0.05, color: '#4CAF50' },
        { id: 'PD', x: 0.5, z: 0.05, color: '#FF6B6B' },
        { id: 'T1', x: 1.5, z: 0.05, color: '#4ECDC4' },
        { id: 'T2', x: 1.5, z: 0.05, color: '#45B7D1' },
        { id: 'T3', x: 6, z: 0.1, color: '#96CEB4' },
        { id: 'ARC', x: 6, z: 1.5, color: '#DDA0DD' },
      ];

      zoneLabels.forEach(label => {
        g.append('text')
          .attr('x', xScale(label.x))
          .attr('y', yScale(label.z) + 15)
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .style('fill', label.color)
          .style('opacity', 0.6)
          .text(label.id);
      });

      // Draw data points
      validData.forEach((d) => {
        const cx = xScale(d.coordinates.x);
        const cy = yScale(d.coordinates.z);
        const faultType = d.fault_type || 'UNK';
        const fillColor = colorScale(faultType);
        const yValue = d.coordinates.y || 0;

        // Circle size based on R2 value
        const r = 4 + (Math.min(yValue, 10) / 10) * 8;

        // Main circle
        const circle = g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', r)
          .attr('fill', fillColor)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer');

        // Tooltip on hover
        circle.on('mouseover', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', r + 4)
            .attr('stroke-width', 3);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', r)
            .attr('stroke-width', 2);
        });

        const date = d.sample_date ? new Date(d.sample_date).toLocaleDateString() : 'N/A';
        const faultName = d.fault_name || 'Unknown';
        circle.append('title')
          .text(`Date: ${date}\nFault: ${faultName}\nR1 (C2H4/C2H6): ${d.coordinates.x.toFixed(3)}\nR2 (CH4/H2): ${d.coordinates.y.toFixed(3)}\nR3 (C2H2/C2H4): ${d.coordinates.z.toFixed(3)}`);
      });

      // Legend
      const legend = g.append('g')
        .attr('transform', `translate(${innerWidth - 140}, 40)`);

      legend.append('rect')
        .attr('width', 130)
        .attr('height', 170)
        .attr('fill', 'white')
        .attr('opacity', 0.95)
        .attr('rx', 4)
        .attr('ry', 4)
        .style('stroke', '#ddd')
        .style('stroke-width', 1);

      const legendData = [
        { type: 'NL', label: 'NL - Normal' },
        { type: 'PD', label: 'PD - Partial Discharge' },
        { type: 'ARC', label: 'ARC - Arcing' },
        { type: 'T1', label: 'T1 (<300 C)' },
        { type: 'T2', label: 'T2 (300-700 C)' },
        { type: 'T3', label: 'T3 (>700 C)' },
        { type: 'UNK', label: 'UNK - Unknown' },
      ];

      legendData.forEach((item, i) => {
        const row = legend.append('g')
          .attr('transform', `translate(8, ${10 + i * 20})`);

        row.append('rect')
          .attr('width', 14)
          .attr('height', 14)
          .attr('fill', colorScale(item.type))
          .attr('rx', 2)
          .attr('ry', 2)
          .style('stroke', '#999')
          .style('stroke-width', 0.5);

        row.append('text')
          .attr('x', 20)
          .attr('y', 11)
          .style('font-size', '10px')
          .style('fill', '#333')
          .text(item.label);
      });

    } catch (err) {
      console.error('Error rendering Rogers chart:', err);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div style={styles.noDataContainer}>
        <p>📊 No Rogers Ratio data available</p>
        <p style={styles.noDataSubtext}>Make sure your gas data includes H2, CH4, C2H6, C2H4, C2H2</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    overflowX: 'auto',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    padding: '10px'
  },
  noDataContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  noDataSubtext: {
    fontSize: '13px',
    color: '#999',
    marginTop: '8px'
  }
};

export default RogersRatioChart;
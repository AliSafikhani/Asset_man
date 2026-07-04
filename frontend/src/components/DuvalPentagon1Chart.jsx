import React, { useEffect, useRef, useState } from 'react';

const DuvalPentagon1Chart = ({ data, width = 650, height = 600 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) {
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

      // Define pentagon zones (based on the coordinates from your algorithm)
      const zones = [
        {
          id: 'PD',
          label: 'PD',
          color: '#FF6B6B',
          centroid: { x: -0.5, y: 28 },
          points: [
            [0, 33], [-1, 33], [-1, 24.5], [0, 24.5]
          ]
        },
        {
          id: 'S',
          label: 'S',
          color: '#A8E6CF',
          centroid: { x: -15, y: 18 },
          points: [
            [0, 1.5], [-35, 3.1], [-38, 12.4], [0, 40], [0, 24.5]
          ]
        },
        {
          id: 'T1',
          label: 'T1',
          color: '#4ECDC4',
          centroid: { x: -18, y: -10 },
          points: [
            [-6, -4], [-22.5, -32.4], [-23.5, -32.4], [-35, 3], [0, 1.5], [0, -3]
          ]
        },
        {
          id: 'T2',
          label: 'T2',
          color: '#45B7D1',
          centroid: { x: -10, y: -22 },
          points: [
            [-6, -4], [1, -32.4], [-22.5, -32.4]
          ]
        },
        {
          id: 'T3',
          label: 'T3',
          color: '#96CEB4',
          centroid: { x: 10, y: -22 },
          points: [
            [0, -3], [24.3, -30], [23.5, -32.4], [1, -32.4], [-6, -4]
          ]
        },
        {
          id: 'D1',
          label: 'D1',
          color: '#FFEAA7',
          centroid: { x: 20, y: 18 },
          points: [
            [0, 40], [38, 12.4], [32, -6.1], [4, 16], [0, 1.5]
          ]
        },
        {
          id: 'D2',
          label: 'D2',
          color: '#DDA0DD',
          centroid: { x: 15, y: -8 },
          points: [
            [4, 16], [32, -6.1], [24.3, -30], [0, -3], [0, 1.5]
          ]
        }
      ];

      // Calculate the overall bounds
      const allX = zones.flatMap(z => z.points.map(p => p[0]));
      const allY = zones.flatMap(z => z.points.map(p => p[1]));
      const minX = Math.min(...allX) - 5;
      const maxX = Math.max(...allX) + 5;
      const minY = Math.min(...allY) - 5;
      const maxY = Math.max(...allY) + 5;

      // Create scales
      const xScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([innerHeight, 0]);

      // Draw each zone as a filled polygon
      zones.forEach(zone => {
        const polygonPath = d3.line()
          .x(d => xScale(d[0]))
          .y(d => yScale(d[1]))
          .curve(d3.curveLinearClosed);

        g.append('path')
          .datum(zone.points)
          .attr('d', polygonPath)
          .attr('fill', zone.color)
          .attr('fill-opacity', 0.5)
          .attr('stroke', '#999')
          .attr('stroke-width', 0.5)
          .attr('stroke-opacity', 0.3);
      });

      const pentagonPoints = [
        [0, 40],        // Top (from D1)
        [38, 12.4],     // Top-Right (from D1)
        [23.5, -32.4],    // Bottom-Right (from T3/D2)
        [1, -32.4],     // Bottom (from T2)
        [-23.5, -32.4], // Bottom-Left (from T1)
        [-38, 12.4],       // Top-Left (from T1)
        [0, 40]         // Back to Top
      ];

      const pentagonPath = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]))
        .curve(d3.curveLinearClosed);

      g.append('path')
        .datum(pentagonPoints)
        .attr('d', pentagonPath)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 2);

      // Zone Labels
      zones.forEach(zone => {
        const labelGroup = g.append('g');
        labelGroup.append('rect')
          .attr('x', xScale(zone.centroid.x) - 22)
          .attr('y', yScale(zone.centroid.y) - 12)
          .attr('width', 44)
          .attr('height', 24)
          .attr('fill', 'white')
          .attr('rx', 4)
          .attr('ry', 4)
          .style('opacity', 0.85)
          .style('stroke', '#ddd')
          .style('stroke-width', 0.5);

        labelGroup.append('text')
          .attr('x', xScale(zone.centroid.x))
          .attr('y', yScale(zone.centroid.y) + 4)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', '#222222')
          .text(zone.id);
      });

      // Axis labels
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text('X-axis');

      g.append('text')
        .attr('x', -30)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .attr('transform', 'rotate(-90)')
        .text('Y-axis');

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
          .style('font-size', '14px')
          .style('fill', '#999')
          .text('No valid data points');
        return;
      }

      // Draw data points
      validData.forEach((d) => {
        const cx = xScale(d.coordinates.x);
        const cy = yScale(d.coordinates.y);
        const zone = d.fault_zone || 'ND';
        const fillColor = colorScale(zone);

        const circle = g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 8)
          .attr('fill', fillColor)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer');

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
            .attr('stroke-width', 2);
        });

        const date = d.sample_date ? new Date(d.sample_date).toLocaleDateString() : 'N/A';
        circle.append('title')
          .text(`Date: ${date}\nZone: ${zone}\nFault: ${d.fault_name || 'Unknown'}\nH2: ${d.percentages?.H2 || 0}%\nCH4: ${d.percentages?.CH4 || 0}%\nC2H6: ${d.percentages?.C2H6 || 0}%\nC2H4: ${d.percentages?.C2H4 || 0}%\nC2H2: ${d.percentages?.C2H2 || 0}%`);
      });

      // Legend
      const legend = g.append('g')
        .attr('transform', `translate(${innerWidth - 140}, 10)`);

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
          .attr('transform', `translate(8, ${12 + i * 18})`);

        row.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', colorScale(item.zone))
          .attr('rx', 2)
          .attr('ry', 2)
          .style('stroke', '#999')
          .style('stroke-width', 0.5);

        row.append('text')
          .attr('x', 18)
          .attr('y', 10)
          .style('font-size', '9px')
          .style('fill', '#333')
          .text(item.label);
      });

    } catch (err) {
      console.error('Error rendering with d3:', err);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div style={styles.noDataContainer}>
        <p>No Duval Pentagon 1 data available</p>
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
  }
};

export default DuvalPentagon1Chart;
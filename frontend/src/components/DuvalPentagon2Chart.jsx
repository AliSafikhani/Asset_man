import React, { useEffect, useRef, useState } from 'react';

const DuvalPentagon2Chart = ({ data, width = 650, height = 600 }) => {
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

      // Calculate the overall bounds
      const allX = zones.flatMap(z => z.points.map(p => p[0]));
      const allY = zones.flatMap(z => z.points.map(p => p[1]));
      const minX = Math.min(...allX) - 10;
      const maxX = Math.max(...allX) + 10;
      const minY = Math.min(...allY) - 10;
      const maxY = Math.max(...allY) + 10;

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
          .attr('stroke', 'none');
      });

      // Draw the pentagon outline
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

      // Draw internal zone boundary lines
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
          .attr('stroke', '#888')
          .attr('stroke-width', 0.5)
          .attr('stroke-dasharray', '3,3');
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
          .attr('ry', 4)
          .style('opacity', 0.85)
          .style('stroke', '#ddd')
          .style('stroke-width', 0.5);

        labelGroup.append('text')
          .attr('x', xScale(label.x))
          .attr('y', yScale(label.y) + 4)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', '#222')
          .text(label.id);
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
        .domain(['PD', 'S', 'O', 'C', 'T3H', 'D1', 'D2', 'NA'])
        .range(['#FF6B6B', '#A8E6CF', '#FFB74D', '#A1887F', '#96CEB4', '#FFEAA7', '#DDA0DD', '#E0E0E0']);

      // Filter valid data (skip NA results)
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
        const note = d.note || '';
        circle.append('title')
          .text(`Date: ${date}\nZone: ${zone}\nFault: ${d.fault_name || 'Unknown'}${note ? '\nNote: ' + note : ''}\nH2: ${d.percentages?.H2 || 0}%\nCH4: ${d.percentages?.CH4 || 0}%\nC2H6: ${d.percentages?.C2H6 || 0}%\nC2H4: ${d.percentages?.C2H4 || 0}%\nC2H2: ${d.percentages?.C2H2 || 0}%`);
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
        <p>No Duval Pentagon 2 data available</p>
        <p style={styles.noDataSubtext}>Only applies when Pentagon 1 is T1, T2, or T3</p>
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

export default DuvalPentagon2Chart;
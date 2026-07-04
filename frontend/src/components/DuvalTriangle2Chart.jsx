import React, { useEffect, useRef, useState } from 'react';

const DuvalTriangle2Chart = ({ data, width = 650, height = 600 }) => {
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

      const sin60 = Math.sin(Math.PI / 3);
      const cos60 = Math.cos(Math.PI / 3);
      
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

      const zones = [
        {
          id: 'N', label: 'N', color: '#4CAF50',
          centroid: { x: 1.5, y: 1.0 * sin60 },
          points: [
            [0.6 + (0.2 * cos60), 0.2 * sin60],
            [2.3 + (0.2 * cos60), 0.2 * sin60],
            [2.3 + (1.9 * cos60), 1.9 * sin60],
            [0.6 + (1.9 * cos60), 1.9 * sin60],
            [0.6 + (0.2 * cos60), 0.2 * sin60]
          ]
        },
        {
          id: 'T3', label: 'T3', color: '#96CEB4',
          centroid: { x: 9.0, y: 1.5 * sin60 },
          points: [
            [8.5, 0],
            [10, 0],
            [10 - (5 * cos60), 5 * sin60],
            [5 + (3.5 * cos60), 3.5 * sin60],
            [8.5, 0]
          ]
        },
        {
          id: 'X3', label: 'X3', color: '#FFD93D',
          centroid: { x: 6.0, y: 2.0 * sin60 },
          points: [
            [2.3, 0],
            [8.5, 0],
            [2.3 + (6.2 * cos60), 6.2 * sin60],
            [2.3, 0]
          ]
        },
        {
          id: 'T2', label: 'T2', color: '#45B7D1',
          centroid: { x: 7.0, y: 4.5 * sin60 },
          points: [
            [5 + (3.5 * cos60), 3.5 * sin60],
            [10 - (5 * cos60), 5 * sin60],
            [10 - (7.7 * cos60), 7.7 * sin60],
            [2.3 + (6.2 * cos60), 6.2 * sin60],
            [5 + (3.5 * cos60), 3.5 * sin60]
          ]
        },
        {
          id: 'D1', label: 'D1', color: '#FFEAA7',
          centroid: { x: 1.0, y: 3.5 * sin60 },
          points: [
            [0, 0],
            [2.3, 0],
            [2.3 + (0.2 * cos60), 0.2 * sin60],
            [0.6 + (0.2 * cos60), 0.2 * sin60],
            [0.6 + (1.9 * cos60), 1.9 * sin60],
            [1.9 * cos60, 1.9 * sin60],
            [0, 0]
          ]
        },
        {
          id: 'X1', label: 'X1', color: '#FF6B6B',
          centroid: { x: 3.5, y: 6.0 * sin60 },
          points: [
            [1.9 * cos60, 1.9 * sin60],
            [2.3 + (1.9 * cos60), 1.9 * sin60],
            [10 - (7.7 * cos60), 7.7 * sin60],
            [5, 10 * sin60],
            [1.9 * cos60, 1.9 * sin60]
          ]
        }
      ];

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

      const trianglePoints = vertices.map(v => [v.x, v.y]);
      const trianglePath = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));

      g.append('path')
        .datum([...trianglePoints, trianglePoints[0]])
        .attr('d', trianglePath)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 2);

      zones.forEach(zone => {
        const labelGroup = g.append('g');
        labelGroup.append('rect')
          .attr('x', xScale(zone.centroid.x) - 20)
          .attr('y', yScale(zone.centroid.y) - 12)
          .attr('width', 40)
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
          .style('font-size', '13px')
          .style('font-weight', 'bold')
          .style('fill', '#222')
          .text(zone.id);
      });

      const vertexLabels = [
        { x: 0, y: -0.8, label: 'CH4' },
        { x: 10, y: -0.8, label: 'C2H4' },
        { x: 5, y: 10 * sin60 + 0.8, label: 'C2H2' }
      ];

      vertexLabels.forEach(v => {
        g.append('text')
          .attr('x', xScale(v.x))
          .attr('y', yScale(v.y))
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '13px')
          .style('font-weight', 'bold')
          .style('fill', '#333')
          .text(v.label);
      });

      const colorScale = d3.scaleOrdinal()
        .domain(['N', 'T3', 'X3', 'T2', 'D1', 'X1', 'UNK'])
        .range(['#4CAF50', '#96CEB4', '#FFD93D', '#45B7D1', '#FFEAA7', '#FF6B6B', '#95A5A6']);

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
          .attr('text-anchor', 'middle')
          .style('font-size', '14px')
          .style('fill', '#999')
          .text('No valid data points');
        return;
      }

      validData.forEach((d) => {
        const cx = xScale(d.coordinates.x);
        const cy = yScale(d.coordinates.y);
        const zone = d.fault_zone || 'UNK';
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
          .text(`Date: ${date}\nZone: ${zone}\nFault: ${d.fault_name || 'Unknown'}\nCH4: ${d.percentages?.CH4 || 0}%\nC2H2: ${d.percentages?.C2H2 || 0}%\nC2H4: ${d.percentages?.C2H4 || 0}%`);
      });

      const legend = g.append('g')
        .attr('transform', `translate(${innerWidth - 150}, 10)`);

      legend.append('rect')
        .attr('width', 140)
        .attr('height', 160)
        .attr('fill', 'white')
        .attr('opacity', 0.95)
        .attr('rx', 4)
        .attr('ry', 4)
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
        <p>No Duval Triangle 2 data available</p>
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

export default DuvalTriangle2Chart;
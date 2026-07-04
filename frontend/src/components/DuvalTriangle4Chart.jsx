import React, { useEffect, useRef, useState } from 'react';

const DuvalTriangle4Chart = ({ data, width = 650, height = 600 }) => {
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
      
      // Triangle vertices
      const vertices = [
        { x: 0, y: 0, label: 'H2' },
        { x: 10, y: 0, label: 'C2H6' },
        { x: 5, y: 10 * sin60, label: 'CH4' }
      ];

      // Scales
      const xScale = d3.scaleLinear()
        .domain([-0.5, 10.5])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([-0.5, 10 * sin60 + 0.5])
        .range([innerHeight, 0]);

      // Define zone polygons for Duval Triangle 4
      // Using the coordinates from your original code
      const zones = [
        // O Zone (Overheating <250°C)
        {
          id: 'O',
          label: 'O',
          color: '#FFB74D',
          centroid: { x: 2.5, y: 0.5 * sin60 },
          points: [
            [0, 0],
            [7, 0],
            [7 - (0.9 * cos60), 0.9 * sin60],
            [0.9 * cos60, 0.9 * sin60]
          ]
        },
        // C Zone (Carbonization >250°C)
        {
          id: 'C',
          label: 'C',
          color: '#A1887F',
          centroid: { x: 8.5, y: 0.8 * sin60 },
          points: [
            [7, 0],
            [10, 0],
            [10 - (6.4 * cos60), 6.4 * sin60],
            [7.6 - (4 * cos60), 4 * sin60],
            [7.6 - (1.5 * cos60), 1.5 * sin60],
            [7 - (1.5 * cos60), 1.5 * sin60]
          ]
        },
        // ND Zone (Not Determined)
        {
          id: 'ND',
          label: 'ND',
          color: '#90A4AE',
          centroid: { x: 3.0, y: 2.0 * sin60 },
          points: [
            [0.9 * cos60, 0.9 * sin60],
            [5.4 - (0.9 * cos60), 0.9 * sin60],
            [4.6 * cos60, 4.6 * sin60]
          ]
        },
        // S Zone (Stray Gassing) - large zone
        {
          id: 'S',
          label: 'S',
          color: '#A8E6CF',
          centroid: { x: 5.5, y: 6.0 * sin60 },
          points: [
            [5.4 - (0.9 * cos60), 0.9 * sin60],
            [7 - (0.9 * cos60), 0.9 * sin60],
            [7 - (1.5 * cos60), 1.5 * sin60],
            [7.6 - (1.5 * cos60), 1.5 * sin60],
            [7.6 - (4 * cos60), 4 * sin60],
            [10 - (6.4 * cos60), 6.4 * sin60],
            [10 - (8.5 * cos60), 8.5 * sin60],
            [1.5 + (8.4 * cos60), 8.4 * sin60],
            [0.2 + (9.7 * cos60), 9.7 * sin60],
            [10 - (9.8 * cos60), 9.8 * sin60],
            [5, 10 * sin60],
            [4.6 * cos60, 4.6 * sin60]
          ]
        },
        // PD Zone (Partial Discharge)
        {
          id: 'PD',
          label: 'PD',
          color: '#FF6B6B',
          centroid: { x: 7.5, y: 8.5 * sin60 },
          points: [
            [1.5 + (8.4 * cos60), 8.4 * sin60],
            [10 - (8.5 * cos60), 8.5 * sin60],
            [10 - (9.8 * cos60), 9.8 * sin60],
            [0.2 + (9.7 * cos60), 9.7 * sin60]
          ]
        }
      ];

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

      // Draw the main triangle outline
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

      // Zone Labels
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

      // Vertex Labels
      const vertexLabels = [
        { x: 0, y: -0.8, label: 'H2' },
        { x: 10, y: -0.8, label: 'C2H6' },
        { x: 5, y: 10 * sin60 + 0.8, label: 'CH4' }
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

      // Color scale for data points
      const colorScale = d3.scaleOrdinal()
        .domain(['O', 'C', 'ND', 'S', 'PD', 'NA', 'UNK'])
        .range(['#FFB74D', '#A1887F', '#90A4AE', '#A8E6CF', '#FF6B6B', '#E0E0E0', '#95A5A6']);

      // Filter valid data (skip NA results)
      const validData = data.filter(d => 
        d.coordinates && 
        typeof d.coordinates.x === 'number' && 
        typeof d.coordinates.y === 'number' &&
        !isNaN(d.coordinates.x) &&
        !isNaN(d.coordinates.y) &&
        d.fault_zone !== 'NA'  // Skip Not Applicable
      );

      if (validData.length === 0) {
        g.append('text')
          .attr('x', xScale(5))
          .attr('y', yScale(5 * sin60))
          .attr('text-anchor', 'middle')
          .style('font-size', '14px')
          .style('fill', '#999')
          .text('No valid data points (NA results skipped)');
        return;
      }

      // Draw data points
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
        const note = d.note || '';
        circle.append('title')
          .text(`Date: ${date}\nZone: ${zone}\nFault: ${d.fault_name || 'Unknown'}${note ? '\nNote: ' + note : ''}\nH2: ${d.percentages?.H2 || 0}%\nCH4: ${d.percentages?.CH4 || 0}%\nC2H6: ${d.percentages?.C2H6 || 0}%`);
      });

      // Legend
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
        { zone: 'O', label: 'O - Overheating <250' },
        { zone: 'C', label: 'C - Carbonization >250' },
        { zone: 'ND', label: 'ND - Not Determined' },
        { zone: 'S', label: 'S - Stray Gassing' },
        { zone: 'PD', label: 'PD - Partial Discharge' },
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
        <p>No Duval Triangle 4 data available</p>
        <p style={styles.noDataSubtext}>Only applies when Duval 1 is PD, T1, or T2</p>
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


export default DuvalTriangle4Chart;
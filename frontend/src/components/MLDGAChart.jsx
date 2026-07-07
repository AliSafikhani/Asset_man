// frontend/src/components/MLDGAChart.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const MLDGAChart = ({ data, width = 800, height = 600 }) => {
  // Check if data exists
  if (!data || data.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        color: '#888'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🤖</div>
          <h3>No ML DGA Data Available</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Please run DGA analysis to see ML predictions</p>
        </div>
      </div>
    );
  }

  // Color map for fault types
  const colorMap = {
    'PD': '#FF6B6B',
    'T1': '#4ECDC4',
    'T2': '#45B7D1',
    'T3': '#96CEB4',
    'D1': '#FFEAA7',
    'D2': '#DDA0DD',
    'N': '#4CAF50'
  };

  // Sort fault classes for consistent display
  const allFaultClasses = [...new Set(
    data.flatMap(s => Object.keys(s.probabilities || {}))
  )];
  
  // Sort in a specific order
  const faultClasses = ['PD', 'D1', 'D2', 'T1', 'T2', 'T3', 'N'].filter(
    cls => allFaultClasses.includes(cls)
  );

  // Prepare chart data - combine all samples with probabilities
  const chartData = data.map((sample, index) => {
    const probabilities = sample.probabilities || {};
    const faultType = sample.fault_type || 'N';
    const sampleDate = sample.sample_date || sample.test_date || null;
    
    const dataPoint = {
      name: `Sample ${index + 1}`,
      date: sampleDate ? new Date(sampleDate).toLocaleDateString() : 'N/A',
      faultType: faultType,
      faultName: sample.fault_name || 'Unknown',
      confidence: sample.confidence || 0,
      ...probabilities
    };
    
    return dataPoint;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const sample = chartData.find(d => d.name === label);
      return (
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: '12px 16px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          maxWidth: '300px',
          minWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
            {label} - {sample?.date || 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
            Predicted: <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
              {sample?.faultName || 'Unknown'} ({sample?.faultType || 'N'})
            </span>
            {' '}| Confidence: <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
              {(sample?.confidence || 0) * 100}%
            </span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
            {payload.map((entry, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                gap: '20px', 
                padding: '2px 0',
                fontWeight: sample?.faultType === entry.name ? 'bold' : 'normal'
              }}>
                <span style={{ color: entry.color }}>{entry.name}:</span>
                <span style={{ 
                  fontWeight: sample?.faultType === entry.name ? 'bold' : 'normal',
                  color: sample?.faultType === entry.name ? '#4CAF50' : 'white'
                }}>
                  {(entry.value * 100).toFixed(1)}%
                  {sample?.faultType === entry.name && ' ★'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      width: '100%',
      height: height,
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #e0e0e0',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h4 style={{ margin: 0, color: '#333' }}>
          ML DGA Probabilities
          <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
            ({data.length} samples)
          </span>
        </h4>
        <div style={{ 
          fontSize: '12px', 
          color: '#666',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <span>💡 Hover for details</span>
          <span>🎯 ★ = Predicted fault</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height - 100}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          barGap={2}
          barCategoryGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            domain={[0, 1]} 
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            label={{ 
              value: 'Probability', 
              position: 'insideBottom', 
              offset: -10,
              style: { fontSize: '12px', fill: '#666' }
            }}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={90}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              const item = chartData.find(d => d.name === value);
              return item ? `${value} (${item.faultType})` : value;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="square"
          />
          
          {faultClasses.map((faultClass) => {
            const color = colorMap[faultClass] || `hsl(${Math.random() * 360}, 70%, 60%)`;
            
            return (
              <Bar
                key={faultClass}
                dataKey={faultClass}
                stackId="a"
                fill={color}
                name={faultClass}
                barSize={24}
                radius={[0, 0, 0, 0]}
              >
                {chartData.map((entry, idx) => {
                  const isPredicted = entry.faultType === faultClass;
                  return (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={color}
                      opacity={isPredicted ? 1 : 0.7}
                      stroke={isPredicted ? '#000' : 'none'}
                      strokeWidth={isPredicted ? 2 : 0}
                      style={{
                        filter: isPredicted ? 'brightness(1.1)' : 'none'
                      }}
                    />
                  );
                })}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend with confidence indicator */}
      <div style={{ 
        marginTop: '15px', 
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        flexWrap: 'wrap',
        fontSize: '12px',
        color: '#666'
      }}>
        <span>📊 Stacked bars show probability distribution</span>
        <span>🔲 Highlighted bar = Predicted fault</span>
        <span>⭐ Confidence score shown on hover</span>
      </div>
    </div>
  );
};

export default MLDGAChart;
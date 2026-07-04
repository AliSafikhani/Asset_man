// frontend/src/components/IEC60599Chart3D.jsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// Data point component with hover effect
const DataPoint = ({ position, color, size = 0.2, label, date, faultType }) => {
  const sphereRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (sphereRef.current) {
      const targetScale = hovered ? 1.8 : 1;
      sphereRef.current.scale.x += (targetScale - sphereRef.current.scale.x) * 0.1;
      sphereRef.current.scale.y += (targetScale - sphereRef.current.scale.y) * 0.1;
      sphereRef.current.scale.z += (targetScale - sphereRef.current.scale.z) * 0.1;
    }
  });

  return (
    <group>
      {/* Glow effect */}
      <Sphere 
        position={position} 
        args={[size * 2, 8, 8]}
        visible={hovered}
      >
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15}
        />
      </Sphere>
      
      {/* Main sphere */}
      <Sphere 
        ref={sphereRef}
        position={position} 
        args={[size, 16, 16]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.1}
          roughness={0.2}
          metalness={0.3}
        />
      </Sphere>
      
      {hovered && (
        <Html position={[position[0], position[1] + size + 0.4, position[2]]} center>
          <div style={{
            color: 'white',
            fontSize: '12px',
            background: 'rgba(0,0,0,0.85)',
            padding: '6px 12px',
            borderRadius: '6px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: '200px'
          }}>
            <div style={{ fontWeight: 'bold' }}>{date}</div>
            <div>Fault: {label}</div>
            <div style={{ fontSize: '10px', color: '#aaa' }}>Type: {faultType || 'Unknown'}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Zone cube component
const ZoneCube = ({ position, size, color, label, opacity = 0.12 }) => {
  return (
    <group position={position}>
      {/* Solid box with transparency */}
      <Box args={size} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={opacity} 
          roughness={0.5}
          metalness={0.1}
        />
      </Box>
      {/* Wireframe box */}
      <Box args={size} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.3} 
          wireframe={true}
        />
      </Box>
      {/* Label */}
      {label && (
        <Html position={[0, size[1]/2 + 0.3, 0]} center>
          <div style={{
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(0,0,0,0.9)',
            background: 'rgba(0,0,0,0.7)',
            padding: '2px 8px',
            borderRadius: '4px',
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
};

// Axis label component
const AxisLabel = ({ position, text, color = '#ffffff' }) => {
  return (
    <Html position={position} center>
      <div style={{
        color: color,
        fontSize: '13px',
        fontWeight: 'bold',
        textShadow: '0 0 10px rgba(0,0,0,0.9)',
        pointerEvents: 'none'
      }}>
        {text}
      </div>
    </Html>
  );
};

// Custom Grid Helper using Three.js
const GridHelper = ({ size = 20, divisions = 20, colorCenter = '#444', colorGrid = '#333' }) => {
  const gridRef = useRef();
  
  React.useEffect(() => {
    if (gridRef.current) {
      // Create grid helper using Three.js
      const grid = new THREE.GridHelper(size, divisions, colorCenter, colorGrid);
      gridRef.current.add(grid);
      
      return () => {
        // Cleanup
        while (gridRef.current.children.length > 0) {
          gridRef.current.remove(gridRef.current.children[0]);
        }
      };
    }
  }, [size, divisions, colorCenter, colorGrid]);
  
  return <group ref={gridRef} />;
};

// Custom Axes Helper using Three.js
const AxesHelper = ({ length = 10 }) => {
  const axesRef = useRef();
  
  React.useEffect(() => {
    if (axesRef.current) {
      // Create axes helper using Three.js
      const axes = new THREE.AxesHelper(length);
      axesRef.current.add(axes);
      
      return () => {
        // Cleanup
        while (axesRef.current.children.length > 0) {
          axesRef.current.remove(axesRef.current.children[0]);
        }
      };
    }
  }, [length]);
  
  return <group ref={axesRef} />;
};

// Main chart component
const IEC60599Chart3D = ({ data, width = 800, height = 600 }) => {
  // Check if data exists
  if (!data || data.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        borderRadius: '8px',
        color: '#888'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
          <h3 style={{ color: '#fff' }}>No IEC 60599 Data Available</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Please run DGA analysis to see the 3D chart</p>
        </div>
      </div>
    );
  }

  // Define zone colors based on IEC 60599 zones
  const colorMap = {
    'PD': '#FF6B6B',
    'D1': '#FFEAA7',
    'D2': '#DDA0DD',
    'D1D2': '#FFD93D',
    'T1': '#4ECDC4',
    'T2': '#45B7D1',
    'T3': '#96CEB4',
    'ND': '#90A4AE',
    'UNK': '#95A5A6'
  };

  // Define zone cubes for IEC 60599
  // Ranges: X=C2H4/C2H6, Y=CH4/H2, Z=C2H2/C2H4
  const zones = [
    { 
      id: 'PD', 
      label: 'PD', 
      color: '#FF6B6B', 
      position: [0.1, 0.05, 0.005], 
      size: [0.2, 0.1, 0.01] 
    },
    { 
      id: 'D1', 
      label: 'D1', 
      color: '#FFEAA7', 
      position: [4, 0.3, 4], 
      size: [3, 0.4, 3] 
    },
    { 
      id: 'D2', 
      label: 'D2', 
      color: '#DDA0DD', 
      position: [4, 0.5, 1.5], 
      size: [3, 0.8, 1.8] 
    },
    { 
      id: 'D1D2', 
      label: 'D1/D2', 
      color: '#FFD93D', 
      position: [4, 0.3, 1.8], 
      size: [3, 0.4, 1.5] 
    },
    { 
      id: 'T1', 
      label: 'T1', 
      color: '#4ECDC4', 
      position: [0.5, 3, 0.005], 
      size: [0.9, 2, 0.01] 
    },
    { 
      id: 'T2', 
      label: 'T2', 
      color: '#45B7D1', 
      position: [2.5, 3, 0.05], 
      size: [2.8, 2, 0.1] 
    },
    { 
      id: 'T3', 
      label: 'T3', 
      color: '#96CEB4', 
      position: [6, 3, 0.1], 
      size: [2, 2, 0.2] 
    }
  ];

  // Prepare data points
  const points = data.map(d => {
    const coords = d.coordinates || { x: 0, y: 0, z: 0 };
    const faultType = d.fault_type || 'ND';
    return {
      position: [coords.x || 0, coords.y || 0, coords.z || 0],
      color: colorMap[faultType] || '#95A5A6',
      label: d.fault_name || 'Unknown',
      date: d.sample_date ? new Date(d.sample_date).toLocaleDateString() : 'N/A',
      faultType: faultType
    };
  });

  // Calculate max value for scaling (IEC 60599 typically uses lower ranges)
  const allX = points.map(p => p.position[0]);
  const allY = points.map(p => p.position[1]);
  const allZ = points.map(p => p.position[2]);
  const maxVal = Math.max(10, ...allX, ...allY, ...allZ) + 1;

  return (
    <div style={{
      width: '100%',
      height: height,
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Canvas camera={{ position: [maxVal * 1.1, maxVal * 0.7, maxVal * 1.1], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-10, -5, -10]} intensity={0.5} />
        
        <OrbitControls 
          enableDamping 
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={50}
          autoRotate={false}
          rotateSpeed={0.8}
        />
        
        {/* Grid */}
        <GridHelper size={20} divisions={20} colorCenter="#444" colorGrid="#333" position={[maxVal/2, 0, maxVal/2]} />
        
        {/* Axes */}
        <AxesHelper length={maxVal} />
        
        {/* Axis labels */}
        <AxisLabel position={[maxVal + 0.5, -0.5, 0]} text="X (C2H4/C2H6)" color="#ff6b6b" />
        <AxisLabel position={[0, maxVal + 0.5, 0]} text="Y (CH4/H2)" color="#4ecdc4" />
        <AxisLabel position={[0, -0.5, maxVal + 0.5]} text="Z (C2H2/C2H4)" color="#45b7d1" />

        {/* Title */}
        <Html position={[maxVal/2, maxVal + 0.8, maxVal/2]} center>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(0,0,0,0.9)',
            pointerEvents: 'none'
          }}>
            IEC 60599 Ratio 3D Analysis
          </div>
        </Html>

        {/* Zone Cubes */}
        {zones.map((zone, index) => (
          <ZoneCube
            key={index}
            position={zone.position}
            size={zone.size}
            color={zone.color}
            label={zone.label}
            opacity={0.15}
          />
        ))}

        {/* Data Points */}
        {points.map((point, index) => (
          <DataPoint
            key={index}
            position={point.position}
            color={point.color}
            size={0.2}
            label={point.label}
            date={point.date}
            faultType={point.faultType}
          />
        ))}

        {/* Legend */}
        <Html position={[maxVal + 1.5, maxVal * 0.7, 0]} center>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '12px 15px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '11px',
            minWidth: '120px',
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>🔵 Legend</div>
            {zones.map((zone, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: zone.color,
                  borderRadius: '3px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }} />
                <span style={{ fontSize: '10px' }}>{zone.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{
                width: '14px',
                height: '14px',
                backgroundColor: '#90A4AE',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.2)'
              }} />
              <span style={{ fontSize: '10px' }}>ND - No Diagnosis</span>
            </div>
          </div>
        </Html>
      </Canvas>
    </div>
  );
};

export default IEC60599Chart3D;
"""
IEC 60599 Ratio Algorithm for DGA Interpretation
Based on 3 ratios: X=C2H4/C2H6, Y=CH4/H2, Z=C2H2/C2H4
Used for 3D fault diagnosis according to IEC 60599 standard
"""

from typing import Dict, Any, List, Tuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from .zones import IEC60599Status


class IEC60599Ratio(BaseAlgorithm):
    """IEC 60599 Ratio Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="IEC 60599 Ratio",
            description="IEC 60599 Ratio based on C2H4/C2H6, CH4/H2, C2H2/C2H4",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        self.gas_utils = GasUtils()
    
    def get_required_parameters(self) -> List[str]:
        return ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2']
    
    def get_visualization_type(self) -> str:
        return "3d"
    
    def _get_iec60599_fault(self, x: float, y: float, z: float) -> str:
        """
        Applies the IEC 60599 ratio decision logic.
        X = C2H4/C2H6
        Y = CH4/H2
        Z = C2H2/C2H4
        
        Based on IEC 60599 standard fault classification
        """
        # Handle zero or negative values
        if x <= 0 or y <= 0 or z <= 0:
            return IEC60599Status.ND
        
        # IEC 60599 fault classification rules
        # PD: Partial Discharge
        if x <= 0.2 and y <= 0.1:
            return IEC60599Status.PD
        
        # D1D2: Low/High Energy Discharge (combined zone)
        if x >= 2 and 0.1 <= y <= 0.5 and 1 <= z <= 2.5:
            return IEC60599Status.D1D2
        
        # D1: Low Energy Discharge
        if x >= 1 and 0.1 <= y <= 0.5 and z >= 1:
            return IEC60599Status.D1
        
        # D2: High Energy Discharge
        if x >= 2 and 0.1 <= y <= 1 and 0.6 <= z <= 2.5:
            return IEC60599Status.D2
        
        # T1: Thermal Fault < 300°C
        if x <= 1 and y >= 1:
            return IEC60599Status.T1
        
        # T2: Thermal Fault 300-700°C
        if 1 <= x <= 4 and y >= 1 and z <= 0.1:
            return IEC60599Status.T2
        
        # T3: Thermal Fault > 700°C
        if x > 4 and y >= 1 and z < 0.2:
            return IEC60599Status.T3
        
        # No Diagnosis
        return IEC60599Status.ND
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate IEC 60599 Ratios and fault type"""
        
        print(f"   📊 IEC60599Ratio.calculate() called with parameters: {parameters}")
        
        # Extract gas values with proper handling
        h2 = float(parameters.get('h2', 0) or 0)
        ch4 = float(parameters.get('ch4', 0) or 0)
        c2h6 = float(parameters.get('c2h6', 0) or 0)
        c2h4 = float(parameters.get('c2h4', 0) or 0)
        c2h2 = float(parameters.get('c2h2', 0) or 0)
        
        print(f"   📊 Gas values: H2={h2}, CH4={ch4}, C2H6={c2h6}, C2H4={c2h4}, C2H2={c2h2}")
        
        # Check if we have valid gas data
        if h2 == 0 and ch4 == 0 and c2h6 == 0 and c2h4 == 0 and c2h2 == 0:
            print(f"   ⚠️ No gas data found, returning ND")
            return {
                "fault_type": IEC60599Status.ND,
                "fault_name": "No Data",
                "zone_color": "#95A5A6",
                "ratios": {
                    "X (C2H4/C2H6)": 0,
                    "Y (CH4/H2)": 0,
                    "Z (C2H2/C2H4)": 0
                },
                "coordinates": {"x": 0, "y": 0, "z": 0},
                "zone_range": {},
                "raw_values": {"H2": h2, "CH4": ch4, "C2H6": c2h6, "C2H4": c2h4, "C2H2": c2h2}
            }
        
        # Calculate IEC 60599 ratios with zero handling
        # X = C2H4/C2H6
        if c2h6 > 0.1:
            x = c2h4 / c2h6
        elif c2h4 > 0:
            x = 1e4  # Large number indicating high ratio
        else:
            x = 0
        
        # Y = CH4/H2
        if h2 > 0.1:
            y = ch4 / h2
        elif ch4 > 0:
            y = 1e4
        else:
            y = 0
        
        # Z = C2H2/C2H4
        if c2h4 > 0.1:
            z = c2h2 / c2h4
        elif c2h2 > 0:
            z = 1e4
        else:
            z = 0
        
        print(f"   📊 Ratios: X={x:.3f}, Y={y:.3f}, Z={z:.3f}")
        
        # Determine fault type
        fault_type = self._get_iec60599_fault(x, y, z)
        fault_name = IEC60599Status.ZONE_NAMES.get(fault_type, "Unknown")
        zone_color = IEC60599Status.ZONE_COLORS.get(fault_type, "#95A5A6")
        
        # Get zone range for 3D plotting
        zone_range = IEC60599Status.ZONE_RANGES.get(fault_type, {})
        
        print(f"   ✅ Fault type: {fault_type} - {fault_name}")
        
        return {
            "fault_type": fault_type,
            "fault_name": fault_name,
            "zone_color": zone_color,
            "ratios": {
                "X (C2H4/C2H6)": round(x, 3) if x < 1e4 else ">10k",
                "Y (CH4/H2)": round(y, 3) if y < 1e4 else ">10k",
                "Z (C2H2/C2H4)": round(z, 3) if z < 1e4 else ">10k"
            },
            "coordinates": {
                "x": round(x, 3) if x < 1e4 else 10.0,
                "y": round(y, 3) if y < 1e4 else 10.0,
                "z": round(z, 3) if z < 1e4 else 10.0
            },
            "zone_range": zone_range,
            "raw_values": {
                "H2": h2,
                "CH4": ch4,
                "C2H6": c2h6,
                "C2H4": c2h4,
                "C2H2": c2h2
            }
        }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate IEC 60599 Ratios for multiple samples"""
        print(f"\n📦 IEC60599Ratio.calculate_batch() called with {len(samples)} samples")
        results = []
        for idx, sample in enumerate(samples):
            print(f"\n   --- Sample {idx + 1} ---")
            gas_data = sample.get('gas_data', {})
            print(f"   Gas data: {gas_data}")
            params = {
                'h2': gas_data.get('h2', 0),
                'ch4': gas_data.get('ch4', 0),
                'c2h6': gas_data.get('c2h6', 0),
                'c2h4': gas_data.get('c2h4', 0),
                'c2h2': gas_data.get('c2h2', 0),
            }
            result = self.calculate(params)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            results.append(result)
        print(f"\n📦 Returning {len(results)} results")
        return results
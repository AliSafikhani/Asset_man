"""
Rogers Ratio Algorithm for DGA Interpretation
Based on 3 ratios: R1=C2H4/C2H6, R2=CH4/H2, R3=C2H2/C2H4
Used for 3D fault diagnosis
"""

from typing import Dict, Any, List, Tuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from .zones import RogersStatus


class RogersRatio(BaseAlgorithm):
    """Rogers Ratio Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Rogers Ratio",
            description="Rogers Ratio based on C2H4/C2H6, CH4/H2, C2H2/C2H4",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        self.gas_utils = GasUtils()
    
    def get_required_parameters(self) -> List[str]:
        return ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2']
    
    def get_visualization_type(self) -> str:
        return "3d"
    
    def _get_rogers_fault(self, r1: float, r2: float, r3: float) -> str:
        """
        Applies the Rogers' Ratio decision logic.
        R1 = C2H4/C2H6 (X-axis)
        R2 = CH4/H2 (Y-axis)
        R3 = C2H2/C2H4 (Z-axis)
        """
        # Handle zero or negative values
        if r1 <= 0 or r2 <= 0 or r3 <= 0:
            return RogersStatus.UNK
        
        # Normal condition
        if r1 < 1 and 0.1 <= r2 <= 1 and r3 <= 0.1:
            return RogersStatus.NORMAL
        # Partial Discharge
        elif r1 < 1 and r2 <= 0.1 and r3 <= 0.1:
            return RogersStatus.PD
        # Arcing (Electrical Discharge)
        elif r1 >= 3 and 0.1 <= r2 <= 1 and 0.1 <= r3 <= 3:
            return RogersStatus.ARC
        # Thermal fault < 300 C
        elif 0.1 <= r1 <= 3 and 0.1 <= r2 <= 1 and r3 <= 0.01:
            return RogersStatus.T1
        # Thermal fault 300-700 C
        elif 0.1 <= r1 <= 3 and r2 >= 1 and r3 <= 0.1:
            return RogersStatus.T2
        # Thermal fault > 700 C
        elif r1 >= 3 and r2 >= 1 and r3 <= 0.2:
            return RogersStatus.T3
        else:
            return RogersStatus.UNK
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Rogers Ratio and fault type"""
        
        print(f"   📊 RogersRatio.calculate() called with parameters: {parameters}")
        
        # Extract gas values with proper handling
        h2 = float(parameters.get('h2', 0) or 0)
        ch4 = float(parameters.get('ch4', 0) or 0)
        c2h6 = float(parameters.get('c2h6', 0) or 0)
        c2h4 = float(parameters.get('c2h4', 0) or 0)
        c2h2 = float(parameters.get('c2h2', 0) or 0)
        
        print(f"   📊 Gas values: H2={h2}, CH4={ch4}, C2H6={c2h6}, C2H4={c2h4}, C2H2={c2h2}")
        
        # Check if we have valid gas data
        if h2 == 0 and ch4 == 0 and c2h6 == 0 and c2h4 == 0 and c2h2 == 0:
            print(f"   ⚠️ No gas data found, returning UNK")
            return {
                "fault_type": RogersStatus.UNK,
                "fault_name": "No Data",
                "zone_color": "#95A5A6",
                "ratios": {
                    "R1 (C2H4/C2H6)": 0,
                    "R2 (CH4/H2)": 0,
                    "R3 (C2H2/C2H4)": 0
                },
                "coordinates": {"x": 0, "y": 0, "z": 0},
                "zone_range": {},
                "raw_values": {"H2": h2, "CH4": ch4, "C2H6": c2h6, "C2H4": c2h4, "C2H2": c2h2}
            }
        
        # Avoid division by zero
        r1 = c2h4 / c2h6 if c2h6 > 0 else 0  # C2H4/C2H6
        r2 = ch4 / h2 if h2 > 0 else 0        # CH4/H2
        r3 = c2h2 / c2h4 if c2h4 > 0 else 0   # C2H2/C2H4
        
        print(f"   📊 Ratios: R1={r1:.3f}, R2={r2:.3f}, R3={r3:.3f}")
        
        # Determine fault type
        fault_type = self._get_rogers_fault(r1, r2, r3)
        fault_name = RogersStatus.ZONE_NAMES.get(fault_type, "Unknown")
        zone_color = RogersStatus.ZONE_COLORS.get(fault_type, "#95A5A6")
        
        # Get zone range for 3D plotting
        zone_range = RogersStatus.ZONE_RANGES.get(fault_type, {})
        
        print(f"   ✅ Fault type: {fault_type} - {fault_name}")
        
        return {
            "fault_type": fault_type,
            "fault_name": fault_name,
            "zone_color": zone_color,
            "ratios": {
                "R1 (C2H4/C2H6)": round(r1, 3),
                "R2 (CH4/H2)": round(r2, 3),
                "R3 (C2H2/C2H4)": round(r3, 3)
            },
            "coordinates": {
                "x": round(r1, 3),
                "y": round(r2, 3),
                "z": round(r3, 3)
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
        """Calculate Rogers Ratio for multiple samples"""
        print(f"\n📦 RogersRatio.calculate_batch() called with {len(samples)} samples")
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
"""
Doernenburg Ratio Algorithm for DGA Interpretation
Based on 4 ratios: r1=CH4/H2, r2=C2H2/C2H4, r3=C2H2/CH4, r4=C2H6/C2H2
Used for fault diagnosis with key gas significance check
"""

from typing import Dict, Any, List
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from .zones import DoernenburgStatus


class DoernenburgRatio(BaseAlgorithm):
    """Doernenburg Ratio Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Doernenburg Ratio",
            description="Doernenburg Ratio based on CH4/H2, C2H2/C2H4, C2H2/CH4, C2H6/C2H2",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        self.gas_utils = GasUtils()
    
    def get_required_parameters(self) -> List[str]:
        return ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2', 'co']
    
    def get_visualization_type(self) -> str:
        return "none"
    
    def _get_doernenburg_fault(self, row: Dict[str, Any]) -> str:
        """
        Applies the Doernenburg Ratio decision logic with lower thresholds.
        """
        # Extract values
        h2 = row.get('h2', 0)
        ch4 = row.get('ch4', 0)
        c2h6 = row.get('c2h6', 0)
        c2h4 = row.get('c2h4', 0)
        c2h2 = row.get('c2h2', 0)
        co = row.get('co', 0)
        
        # Ratios
        r1 = row.get('r1', 0)  # CH4/H2
        r2 = row.get('r2', 0)  # C2H2/C2H4
        r3 = row.get('r3', 0)  # C2H2/CH4
        r4 = row.get('r4', 0)  # C2H6/C2H2
        
        print(f"   ظ‹ع؛â€‌ع† Doernenburg check: H2={h2:.1f}, CH4={ch4:.1f}, C2H2={c2h2:.1f}, C2H4={c2h4:.1f}, C2H6={c2h6:.1f}")
        print(f"      r1={r1:.3f}, r2={r2:.3f}, r3={r3:.3f}, r4={r4:.3f}")
        
        # Check for key gas significance with LOWER thresholds
        # Reduced thresholds to catch more cases
        H2_SIG = 20   # Reduced from 100
        CH4_SIG = 30  # Reduced from 120
        C2H2_SIG = 0.5  # Reduced from 1
        C2H4_SIG = 10   # Reduced from 50
        
        is_significant = (
            h2 >= H2_SIG or
            ch4 >= CH4_SIG or
            c2h2 >= C2H2_SIG or
            c2h4 >= C2H4_SIG
        )
        
        if not is_significant:
            print(f"      أ¢â€Œإ’ No significant gas elevations - NORMAL")
            return DoernenburgStatus.NORMAL
        
        # Check if we have valid ratios
        if c2h2 == 0 or c2h4 == 0 or ch4 == 0 or h2 == 0:
            print(f"      أ¢â€Œإ’ Zero values in ratios - NOT DETERMINED")
            return DoernenburgStatus.NOT_DETERMINED
        
        # Partial Discharge (PD)
        # r1 < 0.1 (CH4/H2), r3 < 0.3 (C2H2/CH4), r4 > 0.4 (C2H6/C2H2)
        if r1 < 0.1 and r3 < 0.3 and r4 > 0.4:
            print(f"      أ¢إ“â€¦ PARTIAL DISCHARGE")
            return DoernenburgStatus.PARTIAL_DISCHARGE
        
        # Arcing
        # 0.1 < r1 <= 1.0, r2 > 0.75, r3 > 0.3, r4 <= 0.4
        if 0.1 < r1 <= 1.0 and r2 > 0.75 and r3 > 0.3 and r4 <= 0.4:
            print(f"      أ¢إ“â€¦ ARCING")
            return DoernenburgStatus.ARCING
        
        # Thermal Fault
        # r1 > 1.0, r2 <= 0.75, r3 <= 0.3, r4 > 0.4
        if r1 > 1.0 and r2 <= 0.75 and r3 <= 0.3 and r4 > 0.4:
            print(f"      أ¢إ“â€¦ THERMAL FAULT")
            return DoernenburgStatus.THERMAL_FAULT
        
        # If we have significant gases but no pattern match
        print(f"      أ¢ع‘آ أ¯آ¸عˆ Significant gases but no pattern match - NOT DETERMINED")
        return DoernenburgStatus.NOT_DETERMINED
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Doernenburg Ratio and fault type"""
        
        # Extract gas values
        h2 = parameters.get('h2', 0) or 0.1
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h6 = parameters.get('c2h6', 0) or 0.1
        c2h4 = parameters.get('c2h4', 0) or 0.1
        c2h2 = parameters.get('c2h2', 0) or 0.1
        co = parameters.get('co', 0) or 0.1
        
        # Calculate ratios
        r1 = ch4 / h2 if h2 > 0 else 0
        r2 = c2h2 / c2h4 if c2h4 > 0 else 0
        r3 = c2h2 / ch4 if ch4 > 0 else 0
        r4 = c2h6 / c2h2 if c2h2 > 0 else 0
        
        # Prepare input for fault determination
        row = {
            'h2': h2,
            'ch4': ch4,
            'c2h6': c2h6,
            'c2h4': c2h4,
            'c2h2': c2h2,
            'co': co,
            'r1': r1,
            'r2': r2,
            'r3': r3,
            'r4': r4
        }
        
        # Determine fault type
        fault_type = self._get_doernenburg_fault(row)
        fault_name = DoernenburgStatus.ZONE_NAMES.get(fault_type, "Unknown")
        zone_color = DoernenburgStatus.ZONE_COLORS.get(fault_type, "#95A5A6")
        
        return {
            "fault_type": fault_type,
            "fault_name": fault_name,
            "zone_color": zone_color,
            "ratios": {
                "r1 (CH4/H2)": round(r1, 3),
                "r2 (C2H2/C2H4)": round(r2, 3),
                "r3 (C2H2/CH4)": round(r3, 3),
                "r4 (C2H6/C2H2)": round(r4, 3)
            },
            "raw_values": {
                "H2": h2,
                "CH4": ch4,
                "C2H6": c2h6,
                "C2H4": c2h4,
                "C2H2": c2h2,
                "CO": co
            }
        }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate Doernenburg Ratio for multiple samples"""
        print(f"\nظ‹ع؛â€œآ¦ DoernenburgRatio.calculate_batch() called with {len(samples)} samples")
        results = []
        for idx, sample in enumerate(samples):
            print(f"\n   --- Sample {idx + 1} ---")
            gas_data = sample.get('gas_data', {})
            params = {
                'h2': gas_data.get('h2', 0),
                'ch4': gas_data.get('ch4', 0),
                'c2h6': gas_data.get('c2h6', 0),
                'c2h4': gas_data.get('c2h4', 0),
                'c2h2': gas_data.get('c2h2', 0),
                'co': gas_data.get('co', 0),
            }
            result = self.calculate(params)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            results.append(result)
        print(f"\nظ‹ع؛â€œآ¦ Returning {len(results)} results")
        return results
"""
Duval Triangle 1 Algorithm for DGA Interpretation
Based on %CH4, %C2H2, %C2H4
Using Polygon-Based Zone Detection
"""

import math
from typing import Dict, Any, List, Tuple
from collections import namedtuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils


class DuvalTriangle1Zones:
    """Duval Triangle 1 Zones"""
    PD = "PD"      # Partial Discharge
    T1 = "T1"      # Thermal Fault < 300 C
    T2 = "T2"      # Thermal Fault 300-700 C
    T3 = "T3"      # Thermal Fault > 700 C
    D1 = "D1"      # Discharge D1 (low energy)
    D2 = "D2"      # Discharge D2 (high energy)
    DT = "DT"      # Mixed Fault (DT)
    N = "N"        # Normal
    UNK = "UNK"    # Unknown

    ZONE_NAMES = {
        "PD": "Partial Discharge",
        "T1": "Thermal Fault T1 (<300 C)",
        "T2": "Thermal Fault T2 (300-700 C)",
        "T3": "Thermal Fault T3 (>700 C)",
        "D1": "Discharge D1 (low energy)",
        "D2": "Discharge D2 (high energy)",
        "DT": "Mixed Fault (DT)",
        "N": "Normal Operation",
        "UNK": "Unknown"
    }

    ZONE_COLORS = {
        "PD": "#FF6B6B",
        "T1": "#4ECDC4",
        "T2": "#45B7D1",
        "T3": "#96CEB4",
        "D1": "#FFEAA7",
        "D2": "#DDA0DD",
        "DT": "#F39C12",
        "N": "#4CAF50",
        "UNK": "#95A5A6"
    }


class DuvalTriangle1(BaseAlgorithm):
    """Duval Triangle 1 Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Triangle 1",
            description="Duval Triangle 1 based on %CH4, %C2H2, %C2H4",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        self.gas_utils = GasUtils()
        self.Point = namedtuple("Point", ["x", "y"])
        self.zones = self._define_zones()
    
    def get_required_parameters(self) -> List[str]:
        return ['ch4', 'c2h2', 'c2h4']
    
    def get_visualization_type(self) -> str:
        return "2d"
    
    def _define_zones(self) -> Dict[str, List[Tuple[float, float]]]:
        """Define the polygon vertices for each zone"""
        
        s = math.radians(60)
        si = math.sin(s)
        co = math.cos(s)
        
        # Define all points
        p0 = (0, 0)
        p1 = (2.3, 0)
        p2 = (7.1, 0)
        p3 = (8.5, 0)
        p4 = (10, 0)
        p5 = (7.1 - (3.1 * co), 3.1 * si)
        p6 = (5 + (3.5 * co), 3.5 * si)
        p7 = (5 + (4.6 * co), 4.6 * si)
        p8 = (4 + (4.7 * co), 4.7 * si)
        p9 = (10 - (5 * co), 5 * si)
        p10 = (2.3 + (6.4 * co), 6.4 * si)
        p11 = (9.6 - (7.6 * co), 7.6 * si)
        p12 = (8.7 * co, 8.7 * si)
        p13 = (10 - (8 * co), 8 * si)
        p14 = (9.6 * co, 9.6 * si)
        p15 = (9.8 * co, 9.8 * si)
        p16 = (10 - (9.8 * co), 9.8 * si)
        p17 = (5, 10 * si)
        
        # Convert to Point objects
        P = self.Point
        
        return {
            DuvalTriangle1Zones.PD: [P(*p15), P(*p16), P(*p17)],
            DuvalTriangle1Zones.T1: [P(*p11), P(*p13), P(*p16), P(*p15), P(*p14)],
            DuvalTriangle1Zones.T2: [P(*p7), P(*p9), P(*p13), P(*p11)],
            DuvalTriangle1Zones.T3: [P(*p3), P(*p4), P(*p9), P(*p6)],
            DuvalTriangle1Zones.D1: [P(*p0), P(*p1), P(*p10), P(*p12)],
            DuvalTriangle1Zones.D2: [P(*p1), P(*p2), P(*p5), P(*p8), P(*p10)],
            DuvalTriangle1Zones.DT: [P(*p2), P(*p3), P(*p6), P(*p7), P(*p14), P(*p12), P(*p8), P(*p5)],
        }
    
    def _point_in_polygon(self, x: float, y: float, polygon: List) -> bool:
        """Checks if a point is inside a polygon using the Ray Casting algorithm."""
        n = len(polygon)
        inside = False
        p1 = polygon[0]
        for i in range(n + 1):
            p2 = polygon[i % n]
            if y > min(p1.y, p2.y) and y <= max(p1.y, p2.y) and x <= max(p1.x, p2.x):
                if p1.y != p2.y:
                    xinters = (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x
                if p1.x == p2.x or x <= xinters:
                    inside = not inside
            p1 = p2
        return inside
    
    def _get_duval_fault(self, plot_x: float, plot_y: float) -> str:
        """Determines the fault zone for given plot coordinates."""
        print(f"      🔍 Checking point ({plot_x:.4f}, {plot_y:.4f}) against zones:")
        for zone, polygon in self.zones.items():
            inside = self._point_in_polygon(plot_x, plot_y, polygon)
            print(f"         {zone}: {inside}")
            if inside:
                return zone
        print(f"      ❌ No zone found! Returning UNK")
        return DuvalTriangle1Zones.UNK
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Triangle 1 zone and coordinates"""
        
        # Extract gas values
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h2 = parameters.get('c2h2', 0) or 0.1
        c2h4 = parameters.get('c2h4', 0) or 0.1
        
        print(f"   📊 DuvalTriangle1.calculate() called with:")
        print(f"      CH4: {ch4}, C2H2: {c2h2}, C2H4: {c2h4}")
        
        # Calculate total
        gas_total = ch4 + c2h2 + c2h4
        if gas_total == 0:
            gas_total = 0.0001
        
        # Calculate percentages
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h2 = (c2h2 / gas_total) * 100
        p_c2h4 = (c2h4 / gas_total) * 100
        
        print(f"      Percentages: CH4: {p_ch4:.2f}%, C2H2: {p_c2h2:.2f}%, C2H4: {p_c2h4:.2f}%")
        
        # Calculate 2D coordinates for plotting
        sqrt_75 = math.sqrt(75)
        alfa = (sqrt_75 * p_ch4) / 100
        beta = p_c2h2 / 10
        plot_x = ((-5 / sqrt_75) * alfa) + 10 - beta
        plot_y = alfa
        
        print(f"      Plot coordinates: x={plot_x:.4f}, y={plot_y:.4f}")
        
        # Determine fault zone using polygon-based method
        fault_zone = self._get_duval_fault(plot_x, plot_y)
        
        print(f"      ✅ Fault zone: {fault_zone}")
        
        return {
            "fault_zone": fault_zone,
            "fault_name": DuvalTriangle1Zones.ZONE_NAMES.get(fault_zone, "Unknown"),
            "zone_color": DuvalTriangle1Zones.ZONE_COLORS.get(fault_zone, "#95A5A6"),
            "percentages": {
                "CH4": round(p_ch4, 2),
                "C2H2": round(p_c2h2, 2),
                "C2H4": round(p_c2h4, 2)
            },
            "coordinates": {
                "x": round(plot_x, 4),
                "y": round(plot_y, 4)
            },
            "raw_values": {
                "CH4": ch4,
                "C2H2": c2h2,
                "C2H4": c2h4
            }
        }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate Duval Triangle 1 for multiple samples"""
        print(f"\n📦 DuvalTriangle1.calculate_batch() called with {len(samples)} samples")
        results = []
        for idx, sample in enumerate(samples):
            print(f"\n   --- Sample {idx + 1} ---")
            gas_data = sample.get('gas_data', {})
            params = {
                'ch4': gas_data.get('ch4', 0),
                'c2h2': gas_data.get('c2h2', 0),
                'c2h4': gas_data.get('c2h4', 0),
            }
            result = self.calculate(params)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            results.append(result)
        print(f"\n📦 Returning {len(results)} results")
        return results
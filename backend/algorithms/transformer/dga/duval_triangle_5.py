"""
Duval Triangle 5 Algorithm for DGA Interpretation
Based on %CH4, %C2H4, %C2H6
Used for overheating diagnosis
Only applicable when Duval Triangle 1 gives T2 or T3
"""

import math
from typing import Dict, Any, List, Tuple
from collections import namedtuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from algorithms.transformer.dga import DuvalTriangle1Zones, DuvalTriangle5Zones


class DuvalTriangle5(BaseAlgorithm):
    """Duval Triangle 5 Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Triangle 5",
            description="Duval Triangle 5 based on %CH4, %C2H4, %C2H6",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        self.gas_utils = GasUtils()
        self.Point = namedtuple("Point", ["x", "y"])
        self.zones = self._define_zones()
    
    def get_required_parameters(self) -> List[str]:
        # Duval Triangle 5 uses CH4, C2H4, C2H6
        return ['ch4', 'c2h4', 'c2h6']
    
    def get_visualization_type(self) -> str:
        return "2d"
    
    def _define_zones(self) -> Dict[str, List[Tuple[float, float]]]:
        """Define the polygon vertices for each zone in Duval Triangle 5"""
        
        s = math.radians(60)
        si = math.sin(s)
        co = math.cos(s)
        
        # Define all points (Duval Triangle 5 specific)
        p0 = (0, 0)
        p1 = (1, 0)
        p2 = (3.5, 0)
        p3 = (7, 0)
        p4 = (10, 0)
        p5 = (7 + (1.6 * co), 1.6 * si)
        p6 = (1 + (3.6 * co), 3.6 * si)
        p7 = (4.6 * co, 4.6 * si)
        p8 = (3.5 + (3.5 * co), 3.5 * si)
        p9 = (5 + (3.6 * co), 3.6 * si)
        p10 = (5 + (3.8 * co), 3.8 * si)
        p11 = (1 + (6 * co), 6 * si)
        p12 = (3.5 + (5.3 * co), 5.3 * si)
        p13 = (3.5 + (6.5 * co), 6.5 * si)
        p14 = (1 + (7.6 * co), 7.6 * si)
        p15 = (1 + (7.8 * co), 7.8 * si)
        p16 = (8.6 * co, 8.6 * si)
        p17 = (0.1 + (8.5 * co), 8.5 * si)
        p18 = (9.8 * co, 9.8 * si)
        p19 = (0.1 + (9.7 * co), 9.7 * si)
        p20 = (1 + 9 * co, 9 * si)
        p21 = (10 * co, 10 * si)
        
        # Convert to Point objects
        P = self.Point
        
        return {
            DuvalTriangle5Zones.O: [P(*p0), P(*p1), P(*p6), P(*p7), P(*p0)],
            DuvalTriangle5Zones.O2: [P(*p14), P(*p20), P(*p21), P(*p18), P(*p19), P(*p17), P(*p14)],
            DuvalTriangle5Zones.S: [P(*p7), P(*p6), P(*p14), P(*p16), P(*p7)],
            DuvalTriangle5Zones.PD: [P(*p16), P(*p17), P(*p19), P(*p18), P(*p16)],
            DuvalTriangle5Zones.T2: [P(*p12), P(*p13), P(*p20), P(*p15), P(*p12)],
            DuvalTriangle5Zones.C: [P(*p3), P(*p5), P(*p9), P(*p10), P(*p15), P(*p11), P(*p3)],
            DuvalTriangle5Zones.T31: [P(*p2), P(*p3), P(*p8), P(*p2)],
            DuvalTriangle5Zones.T32: [P(*p3), P(*p4), P(*p13), P(*p12), P(*p10), P(*p9), P(*p5), P(*p3)],
            DuvalTriangle5Zones.ND: [P(*p1), P(*p2), P(*p8), P(*p11), P(*p1)],
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
        for zone, polygon in self.zones.items():
            if self._point_in_polygon(plot_x, plot_y, polygon):
                return zone
        return "UNK"
    
    def _check_duval1_prerequisite(self, parameters: Dict[str, Any]) -> bool:
        """
        Check if Duval Triangle 1 gives T2 or T3.
        Duval Triangle 5 only applies when Duval 1 is T2 or T3.
        """
        # Use CH4, C2H2, C2H4 for Duval 1
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h2 = parameters.get('c2h2', 0) or 0.1
        c2h4 = parameters.get('c2h4', 0) or 0.1
        
        gas_total = ch4 + c2h2 + c2h4
        if gas_total == 0:
            gas_total = 0.0001
        
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h2 = (c2h2 / gas_total) * 100
        p_c2h4 = (c2h4 / gas_total) * 100
        
        # Simplified Duval 1 zone detection
        if p_c2h4 >= 20 and p_c2h4 < 40 and p_c2h2 < 10 and p_ch4 < 50:
            duval1_zone = DuvalTriangle1Zones.T1
        elif p_c2h4 >= 20 and p_c2h4 < 40 and p_c2h2 < 10 and p_ch4 >= 50:
            duval1_zone = DuvalTriangle1Zones.T2
        elif p_c2h4 >= 40 and p_c2h2 < 13 and p_ch4 < 30:
            duval1_zone = DuvalTriangle1Zones.T3
        else:
            duval1_zone = "OTHER"
        
        # Duval 5 applies only for T2 or T3
        allowed_zones = {DuvalTriangle1Zones.T2, DuvalTriangle1Zones.T3}
        return duval1_zone in allowed_zones
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Triangle 5 zone and coordinates"""
        
        # Extract gas values FIRST (CH4, C2H4, C2H6 for Duval 5)
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h4 = parameters.get('c2h4', 0) or 0.1
        c2h6 = parameters.get('c2h6', 0) or 0.1
        
        # Calculate percentages FIRST
        gas_total = ch4 + c2h4 + c2h6
        if gas_total == 0:
            gas_total = 0.0001
        
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h4 = (c2h4 / gas_total) * 100
        p_c2h6 = (c2h6 / gas_total) * 100
        
        # Check prerequisite: Duval 1 must be T2 or T3
        if not self._check_duval1_prerequisite(parameters):
            return {
                "fault_zone": DuvalTriangle5Zones.NA,
                "fault_name": "Not Applicable",
                "zone_color": "#E0E0E0",
                "percentages": {
                    "CH4": round(p_ch4, 2),
                    "C2H4": round(p_c2h4, 2),
                    "C2H6": round(p_c2h6, 2)
                },
                "coordinates": {"x": 0, "y": 0},
                "note": "Duval Triangle 1 must be T2 or T3"
            }
        
        # Calculate coordinates for plotting
        sqrt_75 = math.sqrt(75)
        alfa = (sqrt_75 * p_ch4) / 100
        beta = p_c2h6 / 10
        plot_x = ((-5 / sqrt_75) * alfa) + 10 - beta
        plot_y = alfa
        
        # Determine fault zone
        fault_zone = self._get_duval_fault(plot_x, plot_y)
        
        return {
            "fault_zone": fault_zone,
            "fault_name": DuvalTriangle5Zones.ZONE_NAMES.get(fault_zone, "Unknown"),
            "zone_color": DuvalTriangle5Zones.ZONE_COLORS.get(fault_zone, "#95A5A6"),
            "percentages": {
                "CH4": round(p_ch4, 2),
                "C2H4": round(p_c2h4, 2),
                "C2H6": round(p_c2h6, 2)
            },
            "coordinates": {
                "x": round(plot_x, 4),
                "y": round(plot_y, 4)
            },
            "raw_values": {
                "CH4": ch4,
                "C2H4": c2h4,
                "C2H6": c2h6
            }
        }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate Duval Triangle 5 for multiple samples"""
        results = []
        for sample in samples:
            gas_data = sample.get('gas_data', {})
            params = {
                'ch4': gas_data.get('ch4', 0),
                'c2h4': gas_data.get('c2h4', 0),
                'c2h6': gas_data.get('c2h6', 0),
                'c2h2': gas_data.get('c2h2', 0),  # For Duval 1 check
            }
            result = self.calculate(params)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            results.append(result)
        return results
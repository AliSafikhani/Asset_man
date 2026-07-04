"""
Duval Triangle 4 Algorithm for DGA Interpretation
Based on %H2, %CH4, %C2H6
Used for overheating and partial discharge diagnosis
Only applicable when Duval Triangle 1 gives PD, T1, or T2
"""

import math
from typing import Dict, Any, List, Tuple
from collections import namedtuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from algorithms.transformer.dga import DuvalTriangle1Zones, DuvalTriangle4Zones


class DuvalTriangle4(BaseAlgorithm):
    """Duval Triangle 4 Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Triangle 4",
            description="Duval Triangle 4 based on %H2, %CH4, %C2H6",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        self.gas_utils = GasUtils()
        self.Point = namedtuple("Point", ["x", "y"])
        self.zones = self._define_zones()
    
    def get_required_parameters(self) -> List[str]:
        # Duval Triangle 4 uses H2, CH4, C2H6
        return ['h2', 'ch4', 'c2h6']
    
    def get_visualization_type(self) -> str:
        return "2d"
    
    def _define_zones(self) -> Dict[str, List[Tuple[float, float]]]:
        """Define the polygon vertices for each zone in Duval Triangle 4"""
        
        s = math.radians(60)
        si = math.sin(s)
        co = math.cos(s)
        
        # Define all points (Duval Triangle 4 specific)
        p0 = (0, 0)
        p1 = (7, 0)
        p2 = (10, 0)
        p3 = (0.9 * co, 0.9 * si)
        p4 = (5.4 - (0.9 * co), 0.9 * si)
        p5 = (7 - (0.9 * co), 0.9 * si)
        p6 = (7 - (1.5 * co), 1.5 * si)
        p7 = (7.6 - (1.5 * co), 1.5 * si)
        p8 = (4.6 * co, 4.6 * si)
        p9 = (7.6 - (4 * co), 4 * si)
        p10 = (10 - (6.4 * co), 6.4 * si)
        p11 = (1.5 + (8.4 * co), 8.4 * si)
        p12 = (10 - (8.5 * co), 8.5 * si)
        p13 = (0.2 + (9.7 * co), 9.7 * si)
        p14 = (10 - (9.8 * co), 9.8 * si)
        p15 = (5, 10 * si)
        
        # Convert to Point objects
        P = self.Point
        
        return {
            DuvalTriangle4Zones.O: [P(*p0), P(*p1), P(*p5), P(*p3)],
            DuvalTriangle4Zones.C: [P(*p1), P(*p2), P(*p10), P(*p9), P(*p7), P(*p6)],
            DuvalTriangle4Zones.ND: [P(*p3), P(*p4), P(*p8)],
            DuvalTriangle4Zones.S: [
                P(*p4), P(*p5), P(*p6), P(*p7), P(*p9),
                P(*p10), P(*p12), P(*p11), P(*p13), P(*p14), P(*p15), P(*p8)
            ],
            DuvalTriangle4Zones.PD: [P(*p11), P(*p12), P(*p14), P(*p13)],
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
        Check if Duval Triangle 1 gives PD, T1, or T2.
        Duval Triangle 4 only applies when Duval 1 is PD, T1, or T2.
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
        if p_c2h2 < 4 and p_c2h4 < 20 and p_ch4 >= 98:
            duval1_zone = DuvalTriangle1Zones.PD
        elif p_c2h4 >= 20 and p_c2h4 < 40 and p_c2h2 < 10 and p_ch4 < 50:
            duval1_zone = DuvalTriangle1Zones.T1
        elif p_c2h4 >= 20 and p_c2h4 < 40 and p_c2h2 < 10 and p_ch4 >= 50:
            duval1_zone = DuvalTriangle1Zones.T2
        else:
            duval1_zone = "OTHER"
        
        # Duval 4 applies only for PD, T1, T2
        allowed_zones = {DuvalTriangle1Zones.PD, DuvalTriangle1Zones.T1, DuvalTriangle1Zones.T2}
        return duval1_zone in allowed_zones
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Triangle 4 zone and coordinates"""
        
        # Check prerequisite: Duval 1 must be PD, T1, or T2
        if not self._check_duval1_prerequisite(parameters):
            return {
                "fault_zone": DuvalTriangle4Zones.NA,
                "fault_name": "Not Applicable",
                "zone_color": "#E0E0E0",
                "percentages": {"H2": 0, "CH4": 0, "C2H6": 0},
                "coordinates": {"x": 0, "y": 0},
                "note": "Duval Triangle 1 must be PD, T1, or T2"
            }
        
        # Extract gas values (H2, CH4, C2H6 for Duval 4)
        h2 = parameters.get('h2', 0) or 0.1
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h6 = parameters.get('c2h6', 0) or 0.1
        
        # Calculate total
        gas_total = h2 + ch4 + c2h6
        if gas_total == 0:
            gas_total = 0.0001
        
        # Calculate percentages
        p_h2 = (h2 / gas_total) * 100
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h6 = (c2h6 / gas_total) * 100
        
        # Calculate 2D coordinates for plotting
        sqrt_75 = math.sqrt(75)
        alfa = (sqrt_75 * p_h2) / 100
        beta = p_c2h6 / 10
        plot_x = ((-5 / sqrt_75) * alfa) + 10 - beta
        plot_y = alfa
        
        # Determine fault zone
        fault_zone = self._get_duval_fault(plot_x, plot_y)
        
        return {
            "fault_zone": fault_zone,
            "fault_name": DuvalTriangle4Zones.ZONE_NAMES.get(fault_zone, "Unknown"),
            "zone_color": DuvalTriangle4Zones.ZONE_COLORS.get(fault_zone, "#95A5A6"),
            "percentages": {
                "H2": round(p_h2, 2),
                "CH4": round(p_ch4, 2),
                "C2H6": round(p_c2h6, 2)
            },
            "coordinates": {
                "x": round(plot_x, 4),
                "y": round(plot_y, 4)
            },
            "raw_values": {
                "H2": h2,
                "CH4": ch4,
                "C2H6": c2h6
            }
        }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate Duval Triangle 4 for multiple samples"""
        results = []
        for sample in samples:
            gas_data = sample.get('gas_data', {})
            params = {
                'h2': gas_data.get('h2', 0),
                'ch4': gas_data.get('ch4', 0),
                'c2h6': gas_data.get('c2h6', 0),
                'c2h2': gas_data.get('c2h2', 0),  # For Duval 1 check
                'c2h4': gas_data.get('c2h4', 0),  # For Duval 1 check
            }
            result = self.calculate(params)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            results.append(result)
        return results
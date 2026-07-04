"""
Duval Triangle 2 Algorithm for DGA Interpretation
Based on %CH4, %C2H2, %C2H4
Used for diagnosis of low and high energy discharges
"""

import math
from typing import Dict, Any, List, Tuple
from collections import namedtuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from algorithms.transformer.dga import DuvalTriangle2Zones


class DuvalTriangle2(BaseAlgorithm):
    """Duval Triangle 2 Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Triangle 2",
            description="Duval Triangle 2 for discharge diagnosis based on %CH4, %C2H2, %C2H4",
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
        """Define the polygon vertices for each zone in Duval Triangle 2"""
        
        s = math.radians(60)
        si = math.sin(s)
        co = math.cos(s)
        
        # Define all points (Duval Triangle 2 specific)
        p0 = (0, 0)
        p1 = (2.3, 0)
        p2 = (8.5, 0)
        p3 = (10, 0)
        p4 = (0.6 + (0.2 * co), 0.2 * si)
        p5 = (2.3 + (0.2 * co), 0.2 * si)
        p6 = (1.9 * co, 1.9 * si)
        p7 = (0.6 + (1.9 * co), 1.9 * si)
        p8 = (2.3 + (1.9 * co), 1.9 * si)
        p9 = (5 + (3.5 * co), 3.5 * si)
        p10 = (10 - (5 * co), 5 * si)
        p11 = (2.3 + (6.2 * co), 6.2 * si)
        p12 = (10 - (7.7 * co), 7.7 * si)
        p13 = (5, 10 * si)
        
        # Convert to Point objects
        P = self.Point
        
        return {
            DuvalTriangle2Zones.N: [P(*p4), P(*p5), P(*p8), P(*p7), P(*p4)],
            DuvalTriangle2Zones.T3: [P(*p2), P(*p3), P(*p10), P(*p9), P(*p2)],
            DuvalTriangle2Zones.X3: [P(*p1), P(*p2), P(*p11), P(*p1)],
            DuvalTriangle2Zones.T2: [P(*p9), P(*p10), P(*p12), P(*p11), P(*p9)],
            DuvalTriangle2Zones.D1: [P(*p0), P(*p1), P(*p5), P(*p4), P(*p7), P(*p6), P(*p0)],
            DuvalTriangle2Zones.X1: [P(*p6), P(*p8), P(*p12), P(*p13), P(*p6)],
        }
    
    def _point_in_polygon(self, x: float, y: float, polygon: List) -> bool:
        """
        Checks if a point (x, y) is inside a given polygon using the Ray Casting algorithm.
        """
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
        return DuvalTriangle2Zones.UNK
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Triangle 2 zone and coordinates"""
        
        # Extract gas values
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h2 = parameters.get('c2h2', 0) or 0.1
        c2h4 = parameters.get('c2h4', 0) or 0.1
        
        # Calculate total
        gas_total = ch4 + c2h2 + c2h4
        if gas_total == 0:
            gas_total = 0.0001
        
        # Calculate percentages
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h2 = (c2h2 / gas_total) * 100
        p_c2h4 = (c2h4 / gas_total) * 100
        
        # Calculate 2D coordinates for plotting (same as Duval Triangle 1)
        sqrt_75 = math.sqrt(75)
        alfa = (sqrt_75 * p_ch4) / 100
        beta = p_c2h2 / 10
        plot_x = ((-5 / sqrt_75) * alfa) + 10 - beta
        plot_y = alfa
        
        # Determine fault zone using polygon-based method
        fault_zone = self._get_duval_fault(plot_x, plot_y)
        
        return {
            "fault_zone": fault_zone,
            "fault_name": DuvalTriangle2Zones.ZONE_NAMES.get(fault_zone, "Unknown"),
            "zone_color": DuvalTriangle2Zones.ZONE_COLORS.get(fault_zone, "#95A5A6"),
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
        """Calculate Duval Triangle 2 for multiple samples"""
        results = []
        for sample in samples:
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
        return results
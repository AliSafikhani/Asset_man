"""
Duval Triangle 6 Algorithm for DGA Interpretation
Based on %CH4, %C2H2, %C2H4
Used for discharge and thermal fault diagnosis
"""

import math
from typing import Dict, Any, List, Tuple
from collections import namedtuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from algorithms.transformer.dga import DuvalTriangle6Zones


class DuvalTriangle6(BaseAlgorithm):
    """Duval Triangle 6 Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Triangle 6",
            description="Duval Triangle 6 based on %CH4, %C2H2, %C2H4",
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
        """Define the polygon vertices for each zone in Duval Triangle 6"""
        
        s = math.radians(60)
        si = math.sin(s)
        co = math.cos(s)
        
        # Define all points (Duval Triangle 6 specific)
        p0 = (0, 0)
        p1 = (9.6, 0)
        p2 = (9.8, 0)
        p3 = (10, 0)
        p4 = (10 - (0.2 * co), 0.2 * si)
        p5 = (1.7 * co, 1.7 * si)
        p6 = (9.4 - (1.7 * co), 1.7 * si)
        p7 = (8.2 + (1.2 * co), 1.2 * si)
        p8 = (8.2 + (1.4 * co), 1.4 * si)
        p9 = (10 - (1.8 * co), 1.8 * si)
        p10 = (8.5 - (2.9 * co), 2.9 * si)
        p11 = (9.4 - (2.9 * co), 2.9 * si)
        p12 = (7.8 - (4.3 * co), 4.3 * si)
        p13 = (8.5 - (4.3 * co), 4.3 * si)
        p14 = (4.6 + (4.4 * co), 4.4 * si)
        p15 = (4.6 + (4.8 * co), 4.8 * si)
        p16 = (10 - (5.4 * co), 5.4 * si)
        p17 = (7.8 * co, 7.8 * si)
        p18 = (9 * co, 9 * si)
        p19 = (10 * co, 10 * si)
        
        P = self.Point
        
        return {
            DuvalTriangle6Zones.D1: [P(*p0), P(*p1), P(*p8), P(*p7), P(*p6), P(*p5), P(*p0)],
            DuvalTriangle6Zones.D2: [P(*p5), P(*p6), P(*p11), P(*p10), P(*p13), P(*p12), P(*p17), P(*p5)],
            DuvalTriangle6Zones.DT: [P(*p10), P(*p11), P(*p15), P(*p14), P(*p18), P(*p17), P(*p12), P(*p13), P(*p10)],
            DuvalTriangle6Zones.PD: [P(*p2), P(*p3), P(*p4), P(*p2)],
            DuvalTriangle6Zones.T1: [P(*p1), P(*p2), P(*p4), P(*p9), P(*p8), P(*p1)],
            DuvalTriangle6Zones.T2: [P(*p7), P(*p9), P(*p16), P(*p15), P(*p7)],
            DuvalTriangle6Zones.T3: [P(*p14), P(*p16), P(*p19), P(*p18), P(*p14)],
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
        return DuvalTriangle6Zones.UNK
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Triangle 6 zone and coordinates"""
        
        # Extract gas values (CH4, C2H2, C2H4)
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h2 = parameters.get('c2h2', 0) or 0.1
        c2h4 = parameters.get('c2h4', 0) or 0.1
        c2h6 = parameters.get('c2h6', 0) or 0.1
        h2 = parameters.get('h2', 0) or 0.1
        
        # Calculate percentages
        gas_total = ch4 + c2h2 + c2h4
        if gas_total == 0:
            gas_total = 0.0001
        
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h2 = (c2h2 / gas_total) * 100
        p_c2h4 = (c2h4 / gas_total) * 100
        
        # Calculate ratios for Duval Triangle 6 (unique coordinate calculation)
        r1 = ch4 / (ch4 + c2h6 + c2h4 + c2h2) if (ch4 + c2h6 + c2h4 + c2h2) > 0 else 0
        r2 = c2h2 / (h2 + c2h6 + c2h4 + ch4) if (h2 + c2h6 + c2h4 + ch4) > 0 else 0
        r3 = c2h4 / (h2 + c2h6 + c2h2 + ch4) if (h2 + c2h6 + c2h2 + ch4) > 0 else 0
        
        s_total = r1 + r2 + r3
        if s_total == 0:
            s_total = 0.0001
        
        p1 = (r1 / s_total) * 100
        p2 = (r2 / s_total) * 100
        p3 = (r3 / s_total) * 100
        
        # Calculate coordinates
        s = math.radians(60)
        si = math.sin(s)
        co = math.cos(s)
        
        plot_y = 0.1 * p3 * si
        plot_x = 10 - (0.1 * p2 + 0.1 * p3 * co)
        
        # Determine fault zone
        fault_zone = self._get_duval_fault(plot_x, plot_y)
        
        return {
            "fault_zone": fault_zone,
            "fault_name": DuvalTriangle6Zones.ZONE_NAMES.get(fault_zone, "Unknown"),
            "zone_color": DuvalTriangle6Zones.ZONE_COLORS.get(fault_zone, "#95A5A6"),
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
        """Calculate Duval Triangle 6 for multiple samples"""
        results = []
        for sample in samples:
            gas_data = sample.get('gas_data', {})
            params = {
                'ch4': gas_data.get('ch4', 0),
                'c2h2': gas_data.get('c2h2', 0),
                'c2h4': gas_data.get('c2h4', 0),
                'c2h6': gas_data.get('c2h6', 0),
                'h2': gas_data.get('h2', 0),
            }
            result = self.calculate(params)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            results.append(result)
        return results
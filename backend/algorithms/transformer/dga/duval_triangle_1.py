"""
Duval Triangle 1 Algorithm for DGA Interpretation
Based on %CH4, %C2H2, %C2H4
"""

import math
from typing import Dict, Any, List, Tuple
from datetime import datetime

from algorithms.base_algorithm import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils


class DuvalTriangle1Zones:
    """Duval Triangle 1 Zones"""
    PD = "PD"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"
    D1 = "D1"
    D2 = "D2"
    DT = "DT"
    UNK = "UNK"

    ZONE_NAMES = {
        "PD": "Partial Discharge",
        "T1": "Thermal Fault T1 (<300°C)",
        "T2": "Thermal Fault T2 (300-700°C)",
        "T3": "Thermal Fault T3 (>700°C)",
        "D1": "Discharge D1 (low energy)",
        "D2": "Discharge D2 (high energy)",
        "DT": "Mixed Fault (DT)",
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
        self.gas_utils = GasUtils()
        self.polygons = self._define_polygons()
    
    def get_required_parameters(self) -> List[str]:
        return ['ch4', 'c2h2', 'c2h4']
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Triangle 1 zone and coordinates"""
        
        # Extract gas values
        ch4 = self.gas_utils.get_gas_value(parameters, 'ch4') or 0.1
        c2h2 = self.gas_utils.get_gas_value(parameters, 'c2h2') or 0.1
        c2h4 = self.gas_utils.get_gas_value(parameters, 'c2h4') or 0.1
        
        # Calculate percentages
        gas_total = ch4 + c2h2 + c2h4
        if gas_total == 0:
            gas_total = 0.0001
        
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h2 = (c2h2 / gas_total) * 100
        p_c2h4 = (c2h4 / gas_total) * 100
        
        # Calculate 2D coordinates for plotting
        sqrt_75 = math.sqrt(75)
        alfa = (sqrt_75 * p_ch4) / 100
        beta = p_c2h2 / 10
        plot_x = ((-5 / sqrt_75) * alfa) + 10 - beta
        plot_y = alfa
        
        # Determine fault zone
        fault_zone = self._determine_zone(plot_x, plot_y)
        
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
    
    def _define_polygons(self) -> Dict[str, List[Tuple[float, float]]]:
        """Define the polygon vertices for each zone"""
        
        # Constants for coordinate calculation
        s = math.radians(60)
        si = math.sin(s)
        co = math.cos(s)
        
        # Define all points (p0 to p17 as per the Duval Triangle 1 geometry)
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
        
        return {
            DuvalTriangle1Zones.PD: [p15, p16, p17],
            DuvalTriangle1Zones.T1: [p11, p13, p16, p15, p14],
            DuvalTriangle1Zones.T2: [p7, p9, p13, p11],
            DuvalTriangle1Zones.T3: [p3, p4, p9, p6],
            DuvalTriangle1Zones.D1: [p0, p1, p10, p12],
            DuvalTriangle1Zones.D2: [p1, p2, p5, p8, p10],
            DuvalTriangle1Zones.DT: [p2, p3, p6, p7, p14, p12, p8, p5],
        }
    
    def _point_in_polygon(self, x: float, y: float, polygon: List[Tuple[float, float]]) -> bool:
        """Check if a point is inside a polygon using ray casting"""
        n = len(polygon)
        inside = False
        p1 = polygon[0]
        for i in range(n + 1):
            p2 = polygon[i % n]
            if y > min(p1[1], p2[1]) and y <= max(p1[1], p2[1]) and x <= max(p1[0], p2[0]):
                if p1[1] != p2[1]:
                    xinters = (y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0]
                if p1[0] == p2[0] or x <= xinters:
                    inside = not inside
            p1 = p2
        return inside
    
    def _determine_zone(self, x: float, y: float) -> str:
        """Determine which zone the point falls into"""
        for zone, polygon in self.polygons.items():
            if self._point_in_polygon(x, y, polygon):
                return zone
        return DuvalTriangle1Zones.UNK
    
    def calculate_for_samples(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate Duval Triangle 1 for multiple samples (for batch processing)"""
        results = []
        
        for sample in samples:
            # Extract gas data from sample
            gas_data = sample.get('gas_data', {})
            parameters = {
                'ch4': gas_data.get('ch4', 0),
                'c2h2': gas_data.get('c2h2', 0),
                'c2h4': gas_data.get('c2h4', 0),
            }
            
            result = self.calculate(parameters)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            
            results.append(result)
        
        return results
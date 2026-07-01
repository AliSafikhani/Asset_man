"""
Direct DGA Calculation Utility
Bypasses Algorithm Manager for direct calculations
"""

import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime


class DGACalculator:
    """Direct DGA calculator without Algorithm Manager dependency"""
    
    @staticmethod
    def _define_polygons() -> Dict[str, List[Tuple[float, float]]]:
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
            "PD": [p15, p16, p17],
            "T1": [p11, p13, p16, p15, p14],
            "T2": [p7, p9, p13, p11],
            "T3": [p3, p4, p9, p6],
            "D1": [p0, p1, p10, p12],
            "D2": [p1, p2, p5, p8, p10],
            "DT": [p2, p3, p6, p7, p14, p12, p8, p5],
        }
    
    @staticmethod
    def _point_in_polygon(x: float, y: float, polygon: List[Tuple[float, float]]) -> bool:
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
    
    @staticmethod
    def calculate_duval_triangle1(ch4: float, c2h2: float, c2h4: float) -> Dict[str, Any]:
        """Calculate Duval Triangle 1 zone and coordinates"""
        
        if ch4 == 0 and c2h2 == 0 and c2h4 == 0:
            return {
                "fault_zone": "UNK",
                "fault_name": "No Data",
                "zone_color": "#95A5A6",
                "percentages": {"CH4": 0, "C2H2": 0, "C2H4": 0},
                "coordinates": {"x": 0, "y": 0}
            }
        
        gas_total = ch4 + c2h2 + c2h4
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h2 = (c2h2 / gas_total) * 100
        p_c2h4 = (c2h4 / gas_total) * 100
        
        sqrt_75 = math.sqrt(75)
        alfa = (sqrt_75 * p_ch4) / 100
        beta = p_c2h2 / 10
        plot_x = ((-5 / sqrt_75) * alfa) + 10 - beta
        plot_y = alfa
        
        # Determine fault zone using polygon method
        polygons = DGACalculator._define_polygons()
        fault_zone = "UNK"
        
        for zone, polygon in polygons.items():
            if DGACalculator._point_in_polygon(plot_x, plot_y, polygon):
                fault_zone = zone
                break
        
        # Zone names and colors
        zone_names = {
            "PD": "Partial Discharge",
            "T1": "Thermal Fault T1 (<300°C)",
            "T2": "Thermal Fault T2 (300-700°C)",
            "T3": "Thermal Fault T3 (>700°C)",
            "D1": "Discharge D1 (low energy)",
            "D2": "Discharge D2 (high energy)",
            "DT": "Mixed Fault (DT)",
            "UNK": "Unknown"
        }
        
        zone_colors = {
            "PD": "#FF6B6B",
            "T1": "#4ECDC4",
            "T2": "#45B7D1",
            "T3": "#96CEB4",
            "D1": "#FFEAA7",
            "D2": "#DDA0DD",
            "DT": "#F39C12",
            "UNK": "#95A5A6"
        }
        
        return {
            "fault_zone": fault_zone,
            "fault_name": zone_names.get(fault_zone, "Unknown"),
            "zone_color": zone_colors.get(fault_zone, "#95A5A6"),
            "percentages": {"CH4": round(p_ch4, 2), "C2H2": round(p_c2h2, 2), "C2H4": round(p_c2h4, 2)},
            "coordinates": {"x": round(plot_x, 4), "y": round(plot_y, 4)}
        }
    
    @staticmethod
    def calculate_duval_triangle1_batch(samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for idx, sample in enumerate(samples):
            gas_data = sample.get('gas_data', {})
            result = DGACalculator.calculate_duval_triangle1(
                gas_data.get('ch4', 0),
                gas_data.get('c2h2', 0),
                gas_data.get('c2h4', 0)
            )
            result['id'] = sample.get('id', idx + 1)
            result['sample_date'] = sample.get('sample_date', datetime.now().isoformat())
            results.append(result)
        return results
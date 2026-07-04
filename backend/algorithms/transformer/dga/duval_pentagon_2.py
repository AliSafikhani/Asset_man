"""
Duval Pentagon 2 Algorithm for DGA Interpretation
Based on 5 gases: H2, CH4, C2H6, C2H4, C2H2
Used for overheating and carbonization diagnosis
Only applicable when Duval Pentagon 1 gives T1, T2, or T3
"""

import math
from typing import Dict, Any, List, Tuple
from collections import namedtuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from .zones import DuvalPentagon1Zones, DuvalPentagon2Zones


class DuvalPentagon2(BaseAlgorithm):
    """Duval Pentagon 2 Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Pentagon 2",
            description="Duval Pentagon 2 based on H2, CH4, C2H6, C2H4, C2H2",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        self.gas_utils = GasUtils()
        self.Point = namedtuple("Point", ["x", "y"])
        self.pentagon_gases = ["h2", "ch4", "c2h6", "c2h4", "c2h2"]
        self.zones = self._define_zones()
    
    def get_required_parameters(self) -> List[str]:
        return ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2']
    
    def get_visualization_type(self) -> str:
        return "2d"
    
    def _define_zones(self) -> Dict[str, List[Tuple[float, float]]]:
        """Define the polygon vertices for each zone in Duval Pentagon 2"""
        
        P = self.Point
        
        return {
            DuvalPentagon2Zones.PD: [P(0, 33), P(-1, 33), P(-1, 24.5), P(0, 24.5)],
            DuvalPentagon2Zones.S: [P(0, 1.5), P(-35, 3.1), P(-38, 12.4), P(0, 40), P(0, 24.5)],
            DuvalPentagon2Zones.O: [P(-3.5, -3), P(-11, -8), P(-21.5, -32.4), P(-23.5, -32.4), P(-35, 3.1), P(0, 1.5), P(0, -3)],
            DuvalPentagon2Zones.C: [P(-3.5, -3), P(2.5, -32.4), P(-21.5, -32.4), P(-11, -8)],
            DuvalPentagon2Zones.T3H: [P(0, -3), P(24.3, -30), P(23.5, -32.4), P(2.5, -32.4), P(-3.5, -3)],
            DuvalPentagon2Zones.D1: [P(0, 40), P(38, 12.4), P(32, -6.1), P(4, 16), P(0, 1.5)],
            DuvalPentagon2Zones.D2: [P(4, 16), P(32, -6.1), P(24.3, -30), P(0, -3), P(0, 1.5)],
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
    
    def _get_pentagon_fault(self, plot_x: float, plot_y: float) -> str:
        """Determines the fault zone for given plot coordinates."""
        for zone, polygon in self.zones.items():
            if self._point_in_polygon(plot_x, plot_y, polygon):
                return zone
        return "ND"
    
    def _check_pentagon1_prerequisite(self, parameters: Dict[str, Any]) -> bool:
        """
        Check if Duval Pentagon 1 gives T1, T2, or T3.
        Duval Pentagon 2 only applies when Pentagon 1 is T1, T2, or T3.
        """
        # Calculate Pentagon 1 result
        h2 = parameters.get('h2', 0) or 0.1
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h6 = parameters.get('c2h6', 0) or 0.1
        c2h4 = parameters.get('c2h4', 0) or 0.1
        c2h2 = parameters.get('c2h2', 0) or 0.1
        
        # Calculate percentages for Pentagon 1
        gas_total = h2 + ch4 + c2h6 + c2h4 + c2h2
        if gas_total == 0:
            gas_total = 0.0001
        
        p_h2 = (h2 / gas_total) * 100
        p_ch4 = (ch4 / gas_total) * 100
        p_c2h6 = (c2h6 / gas_total) * 100
        p_c2h4 = (c2h4 / gas_total) * 100
        p_c2h2 = (c2h2 / gas_total) * 100
        
        # Calculate Pentagon 1 coordinates
        x_coords = (
            p_h2 * 0
            + p_c2h6 * -math.cos(math.radians(18))
            + p_ch4 * -math.cos(math.radians(54))
            + p_c2h4 * math.cos(math.radians(54))
            + p_c2h2 * math.cos(math.radians(18))
        ) / 2.5
        
        y_coords = (
            p_h2 * 1
            + p_c2h6 * math.sin(math.radians(18))
            + p_ch4 * -math.sin(math.radians(54))
            + p_c2h4 * -math.sin(math.radians(54))
            + p_c2h2 * math.sin(math.radians(18))
        ) / 2.5
        
        # Simple Pentagon 1 zone detection (simplified)
        # Using the PENTAGON1_ZONES from the original code
        pentagon1_zones = {
            'PD': [[0, 33], [-1, 33], [-1, 24.5], [0, 24.5]],
            'S': [[0, 1.5], [-35, 3.1], [-38, 12.4], [0, 40], [0, 24.5]],
            'T1': [[-6, -4], [-22.5, -32.4], [-35, 3], [0, 1.5], [0, -3]],
            'T2': [[-6, -4], [1, -32.4], [-22.5, -32.4]],
            'T3': [[0, -3], [24.3, -30], [23.5, -32.4], [1, -32.4], [-6, -4]],
            'D1': [[0, 40], [38, 12.4], [32, -6.1], [4, 16], [0, 1.5]],
            'D2': [[4, 16], [32, -6.1], [24.3, -30], [0, -3], [0, 1.5]],
        }
        
        # Simple point-in-polygon for Pentagon 1
        def point_in_polygon_simple(px, py, polygon):
            inside = False
            n = len(polygon)
            p1 = polygon[0]
            for i in range(n + 1):
                p2 = polygon[i % n]
                if py > min(p1[1], p2[1]) and py <= max(p1[1], p2[1]) and px <= max(p1[0], p2[0]):
                    if p1[1] != p2[1]:
                        xinters = (py - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0]
                    if p1[0] == p2[0] or px <= xinters:
                        inside = not inside
                p1 = p2
            return inside
        
        # Check which zone the point falls into
        pentagon1_zone = None
        for zone, polygon in pentagon1_zones.items():
            if point_in_polygon_simple(x_coords, y_coords, polygon):
                pentagon1_zone = zone
                break
        
        # Duval Pentagon 2 applies only for T1, T2, or T3
        allowed_zones = {DuvalPentagon1Zones.T1, DuvalPentagon1Zones.T2, DuvalPentagon1Zones.T3}
        
        # Map string zone names to zone constants
        zone_map = {
            'PD': DuvalPentagon1Zones.PD,
            'S': DuvalPentagon1Zones.S,
            'T1': DuvalPentagon1Zones.T1,
            'T2': DuvalPentagon1Zones.T2,
            'T3': DuvalPentagon1Zones.T3,
            'D1': DuvalPentagon1Zones.D1,
            'D2': DuvalPentagon1Zones.D2,
        }
        
        mapped_zone = zone_map.get(pentagon1_zone)
        return mapped_zone in allowed_zones
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Pentagon 2 zone and coordinates"""
        
        # Check prerequisite: Pentagon 1 must be T1, T2, or T3
        if not self._check_pentagon1_prerequisite(parameters):
            return {
                "fault_zone": DuvalPentagon2Zones.NA,
                "fault_name": "Not Applicable",
                "zone_color": "#E0E0E0",
                "percentages": {"H2": 0, "CH4": 0, "C2H6": 0, "C2H4": 0, "C2H2": 0},
                "coordinates": {"x": 0, "y": 0},
                "note": "Duval Pentagon 1 must be T1, T2, or T3"
            }
        
        # Extract gas values
        h2 = parameters.get('h2', 0) or 0.1
        ch4 = parameters.get('ch4', 0) or 0.1
        c2h6 = parameters.get('c2h6', 0) or 0.1
        c2h4 = parameters.get('c2h4', 0) or 0.1
        c2h2 = parameters.get('c2h2', 0) or 0.1
        
        gas_values = {
            "h2": h2,
            "ch4": ch4,
            "c2h6": c2h6,
            "c2h4": c2h4,
            "c2h2": c2h2
        }
        
        # Calculate total
        gas_total = sum(gas_values.values())
        if gas_total == 0:
            gas_total = 0.0001
        
        # Calculate percentages
        percentages = {}
        for gas, value in gas_values.items():
            percentages[f"percent_{gas}"] = (value / gas_total) * 100
        
        p = percentages
        
        # Get normalized percentages
        norm_C2H2 = p["percent_c2h2"]
        norm_C2H4 = p["percent_c2h4"]
        norm_C2H6 = p["percent_c2h6"]
        norm_CH4 = p["percent_ch4"]
        norm_H2 = p["percent_h2"]
        
        # Calculate X and Y components for each gas
        XC2H2 = (norm_C2H2 * math.cos(math.radians(18))) / 2.5
        YC2H2 = (norm_C2H2 * math.cos(math.radians(72))) / 2.5
        XC2H4 = (norm_C2H4 * math.cos(math.radians(54))) / 2.5
        YC2H4 = (-norm_C2H4 * math.cos(math.radians(36))) / 2.5
        XC2H6 = (-norm_C2H6 * math.cos(math.radians(18))) / 2.5
        YC2H6 = (norm_C2H6 * math.cos(math.radians(72))) / 2.5
        XCH4 = (-norm_CH4 * math.cos(math.radians(54))) / 2.5
        YCH4 = (-norm_CH4 * math.cos(math.radians(36))) / 2.5
        XH2 = 0
        YH2 = norm_H2 / 2.5
        
        # Calculate the area (A) of the polygon
        A = 0.5 * (
            (XH2 * YC2H6 - XC2H6 * YH2)
            + (XC2H6 * YCH4 - XCH4 * YC2H6)
            + (XCH4 * YC2H4 - XC2H4 * YCH4)
            + (XC2H4 * YC2H2 - XC2H2 * YC2H4)
            + (XC2H2 * YH2 - XH2 * YC2H2)
        )
        
        # Calculate centroid coordinates
        if A == 0:
            CX = 0
            CY = 0
        else:
            CX = (1 / (6 * A)) * (
                ((XH2 + XC2H6) * ((XH2 * YC2H6) - (XC2H6 * YH2)))
                + ((XC2H6 + XCH4) * ((XC2H6 * YCH4) - (XCH4 * YC2H6)))
                + ((XCH4 + XC2H4) * ((XCH4 * YC2H4) - (XC2H4 * YCH4)))
                + ((XC2H4 + XC2H2) * ((XC2H4 * YC2H2) - (XC2H2 * YC2H4)))
                + ((XC2H2 + XH2) * ((XC2H2 * YH2) - (XH2 * YC2H2)))
            )
            
            CY = (1 / (6 * A)) * (
                ((YH2 + YC2H6) * ((XH2 * YC2H6) - (XC2H6 * YH2)))
                + ((YC2H6 + YCH4) * (XC2H6 * YCH4 - XCH4 * YC2H6))
                + ((YCH4 + YC2H4) * (XCH4 * YC2H4 - XC2H4 * YCH4))
                + ((YC2H4 + YC2H2) * (XC2H4 * YC2H2 - XC2H2 * YC2H4))
                + ((YC2H2 + YH2) * (XC2H2 * YH2 - XH2 * YC2H2))
            )
        
        # Determine fault zone
        fault_zone = self._get_pentagon_fault(CX, CY)
        
        return {
            "fault_zone": fault_zone,
            "fault_name": DuvalPentagon2Zones.ZONE_NAMES.get(fault_zone, "Unknown"),
            "zone_color": DuvalPentagon2Zones.ZONE_COLORS.get(fault_zone, "#95A5A6"),
            "percentages": {
                "H2": round(percentages["percent_h2"], 2),
                "CH4": round(percentages["percent_ch4"], 2),
                "C2H6": round(percentages["percent_c2h6"], 2),
                "C2H4": round(percentages["percent_c2h4"], 2),
                "C2H2": round(percentages["percent_c2h2"], 2)
            },
            "coordinates": {
                "x": round(CX, 4),
                "y": round(CY, 4)
            },
            "raw_values": {
                "H2": h2,
                "CH4": ch4,
                "C2H6": c2h6,
                "C2H4": c2h4,
                "C2H2": c2h2
            }
        }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate Duval Pentagon 2 for multiple samples"""
        results = []
        for sample in samples:
            gas_data = sample.get('gas_data', {})
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
        return results
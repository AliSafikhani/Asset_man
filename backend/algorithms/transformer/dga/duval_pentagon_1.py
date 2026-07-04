"""
Duval Pentagon 1 Algorithm for DGA Interpretation
Based on 5 gases: H2, CH4, C2H6, C2H4, C2H2
Uses pentagon geometry and centroid calculation
"""

import math
from typing import Dict, Any, List, Tuple
from collections import namedtuple
from algorithms.base import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils
from .zones import DuvalPentagon1Zones


class DuvalPentagon1(BaseAlgorithm):
    """Duval Pentagon 1 Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Pentagon 1",
            description="Duval Pentagon 1 based on H2, CH4, C2H6, C2H4, C2H2",
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
        """Define the polygon vertices for each zone in Duval Pentagon 1"""
        
        P = self.Point
        
        return {
            DuvalPentagon1Zones.PD: [P(0, 33), P(-1, 33), P(-1, 24.5), P(0, 24.5)],
            DuvalPentagon1Zones.S: [P(0, 1.5), P(-35, 3.1), P(-38, 12.4), P(0, 40), P(0, 24.5)],
            DuvalPentagon1Zones.T1: [P(-6, -4), P(-22.5, -32.4),P(-23.5, -32.4), P(-35, 3), P(0, 1.5), P(0, -3)],
            DuvalPentagon1Zones.T2: [P(-6, -4), P(1, -32.4), P(-22.5, -32.4)],
            DuvalPentagon1Zones.T3: [P(0, -3), P(24.3, -30), P(23.5, -32.4), P(1, -32.4), P(-6, -4)],
            DuvalPentagon1Zones.D1: [P(0, 40), P(38, 12.4), P(32, -6.1), P(4, 16), P(0, 1.5)],
            DuvalPentagon1Zones.D2: [P(4, 16), P(32, -6.1), P(24.3, -30), P(0, -3), P(0, 1.5)],
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
        return DuvalPentagon1Zones.ND
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Pentagon 1 zone and coordinates"""
        
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
        # The factor /2.5 adjusts the size of the pentagon
        XC2H2 = (norm_C2H2 * math.cos(math.radians(18))) / 2.5
        YC2H2 = (norm_C2H2 * math.cos(math.radians(72))) / 2.5
        XC2H4 = (norm_C2H4 * math.cos(math.radians(54))) / 2.5
        YC2H4 = (-norm_C2H4 * math.cos(math.radians(36))) / 2.5  # Negative Y for C2H4
        XC2H6 = (-norm_C2H6 * math.cos(math.radians(18))) / 2.5  # Negative X for C2H6
        YC2H6 = (norm_C2H6 * math.cos(math.radians(72))) / 2.5
        XCH4 = (-norm_CH4 * math.cos(math.radians(54))) / 2.5  # Negative X for CH4
        YCH4 = (-norm_CH4 * math.cos(math.radians(36))) / 2.5  # Negative Y for CH4
        XH2 = 0  # H2 is on the Y-axis (X=0)
        YH2 = norm_H2 / 2.5  # H2 contribution is purely in Y
        
        # Calculate the area (A) of the polygon using Shoelace formula
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
            "fault_name": DuvalPentagon1Zones.ZONE_NAMES.get(fault_zone, "Unknown"),
            "zone_color": DuvalPentagon1Zones.ZONE_COLORS.get(fault_zone, "#95A5A6"),
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
        """Calculate Duval Pentagon 1 for multiple samples"""
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
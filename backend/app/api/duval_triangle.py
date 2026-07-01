"""
Duval Triangle 1 Algorithm - Simplified version for API
"""

import math
from typing import Dict, Any, List, Tuple


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


def calculate_duval_triangle1(ch4: float, c2h2: float, c2h4: float) -> Dict[str, Any]:
    """Calculate Duval Triangle 1 zone and coordinates"""
    
    # Handle zero values
    if ch4 == 0 and c2h2 == 0 and c2h4 == 0:
        return {
            "fault_zone": "UNK",
            "fault_name": "No Data",
            "zone_color": "#95A5A6",
            "percentages": {"CH4": 0, "C2H2": 0, "C2H4": 0},
            "coordinates": {"x": 0, "y": 0}
        }
    
    # Calculate percentages
    gas_total = ch4 + c2h2 + c2h4
    p_ch4 = (ch4 / gas_total) * 100
    p_c2h2 = (c2h2 / gas_total) * 100
    p_c2h4 = (c2h4 / gas_total) * 100
    
    # Calculate 2D coordinates for plotting
    sqrt_75 = math.sqrt(75)
    alfa = (sqrt_75 * p_ch4) / 100
    beta = p_c2h2 / 10
    plot_x = ((-5 / sqrt_75) * alfa) + 10 - beta
    plot_y = alfa
    
    # Determine fault zone using simplified logic
    fault_zone = determine_zone_simplified(p_ch4, p_c2h2, p_c2h4)
    
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
        }
    }


def determine_zone_simplified(self, pCH4: float, pC2H2: float, pC2H4: float) -> tuple:
    """Duval Triangle 1 simplified classification (includes DT zone)"""

    # --- Normalize to 100% ---
    total = pCH4 + pC2H2 + pC2H4
    if total <= 0:
        return "Invalid", "Invalid input"

    CH4 = (pCH4 / total) * 100
    C2H2 = (pC2H2 / total) * 100
    C2H4 = (pC2H4 / total) * 100

    # =========================
    # 1. Partial Discharge (PD)
    # =========================
    if C2H2 < 2 and C2H4 < 20 and CH4 > 98:
        return "PD", "Partial Discharge"

    # =========================
    # 2. Discharge zones
    # =========================
    if C2H2 >= 60:
        return "D2", "High Energy Discharge"

    if 13 <= C2H2 < 60:
        return "D1", "Low Energy Discharge"

    # =========================
    # 3. Thermal fault zones
    # =========================

    # High ethylene → thermal severe or transition to discharge/DT region
    if C2H4 >= 50:
        if C2H2 >= 10:
            return "DT", "Mixed Thermal / Discharge (Transition Zone)"
        if CH4 >= 50:
            return "T2", "Thermal Fault 300–700°C"
        else:
            return "T3", "Thermal Fault > 700°C"

    # Medium thermal region
    if 20 <= C2H4 < 50:
        if C2H2 < 10:
            return "T1", "Thermal Fault < 300°C"
        else:
            return "DT", "Mixed Thermal / Discharge"

    # =========================
    # 4. Boundary / ambiguous region
    # =========================
    if 10 <= C2H4 < 20 and C2H2 < 10:
        return "DT", "Transition Zone"

    # =========================
    # 5. Default thermal low level
    # =========================
    return "T1", "Thermal Fault (Low Confidence)"
from typing import Dict, Any, List
from algorithms.base_algorithm import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils

class DuvalTriangle11(BaseAlgorithm):
    """Duval Triangle 1 Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Triangle 1",
            description="Duval Triangle 1 based on %CH4, %C2H2, %C2H4",
            version="1.0"
        )
        self.gas_utils = GasUtils()
    
    def get_required_parameters(self) -> List[str]:
        return ['ch4', 'c2h2', 'c2h4']
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Triangle 1 zone"""
        
        # Extract gas values
        ch4 = self.gas_utils.get_gas_value(parameters, 'ch4')
        c2h2 = self.gas_utils.get_gas_value(parameters, 'c2h2')
        c2h4 = self.gas_utils.get_gas_value(parameters, 'c2h4')
        
        total = ch4 + c2h2 + c2h4
        if total == 0:
            return {
                "zone": "No Data",
                "status": "Insufficient Data",
                "percentages": {"CH4": 0, "C2H2": 0, "C2H4": 0}
            }
        
        # Calculate percentages
        pCH4 = (ch4 / total) * 100
        pC2H2 = (c2h2 / total) * 100
        pC2H4 = (c2h4 / total) * 100
        
        # Determine zone based on Duval Triangle 1 rules
        zone, status = self._determine_zone(pCH4, pC2H2, pC2H4)
        
        return {
            "zone": zone,
            "status": status,
            "percentages": {
                "CH4": round(pCH4, 1),
                "C2H2": round(pC2H2, 1),
                "C2H4": round(pC2H4, 1)
            },
            "raw_values": {
                "CH4": ch4,
                "C2H2": c2h2,
                "C2H4": c2h4
            }
        }
    
def _determine_zone(self, pCH4: float, pC2H2: float, pC2H4: float) -> tuple:
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
from typing import Dict, Any, List
from algorithms.base_algorithm import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils

class DuvalPentagon(BaseAlgorithm):
    """Duval Pentagon Algorithm for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Duval Pentagon",
            description="Duval Pentagon based on %CH4, %C2H2, %C2H4, %C2H6, %H2",
            version="1.0"
        )
        self.gas_utils = GasUtils()
    
    def get_required_parameters(self) -> List[str]:
        return ['ch4', 'c2h2', 'c2h4', 'c2h6', 'h2']
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Duval Pentagon zone"""
        
        # Extract gas values
        ch4 = self.gas_utils.get_gas_value(parameters, 'ch4')
        c2h2 = self.gas_utils.get_gas_value(parameters, 'c2h2')
        c2h4 = self.gas_utils.get_gas_value(parameters, 'c2h4')
        c2h6 = self.gas_utils.get_gas_value(parameters, 'c2h6')
        h2 = self.gas_utils.get_gas_value(parameters, 'h2')
        
        total = ch4 + c2h2 + c2h4 + c2h6 + h2
        if total == 0:
            return {
                "zone": "No Data",
                "status": "Insufficient Data",
                "percentages": {"CH4": 0, "C2H2": 0, "C2H4": 0, "C2H6": 0, "H2": 0}
            }
        
        # Calculate percentages
        pCH4 = (ch4 / total) * 100
        pC2H2 = (c2h2 / total) * 100
        pC2H4 = (c2h4 / total) * 100
        pC2H6 = (c2h6 / total) * 100
        pH2 = (h2 / total) * 100
        
        # Determine zone
        zone, status = self._determine_zone(pCH4, pC2H2, pC2H4, pC2H6, pH2)
        
        return {
            "zone": zone,
            "status": status,
            "percentages": {
                "CH4": round(pCH4, 1),
                "C2H2": round(pC2H2, 1),
                "C2H4": round(pC2H4, 1),
                "C2H6": round(pC2H6, 1),
                "H2": round(pH2, 1)
            },
            "raw_values": {
                "CH4": ch4,
                "C2H2": c2h2,
                "C2H4": c2h4,
                "C2H6": c2h6,
                "H2": h2
            }
        }
    
    def _determine_zone(self, pCH4: float, pC2H2: float, pC2H4: float, 
                        pC2H6: float, pH2: float) -> tuple:
        """Determine Duval Pentagon zone and status"""
        
        # Zone PD - Partial Discharge
        if pC2H2 < 4 and pC2H4 < 20 and pH2 > 50:
            return "PD", "Partial Discharge"
        
        # Zone D1 - Low Energy Discharge
        elif pC2H2 >= 4 and pC2H2 < 20 and pC2H4 < 30:
            return "D1", "Low Energy Discharge"
        
        # Zone D2 - High Energy Discharge
        elif pC2H2 >= 20 and pC2H2 < 50:
            return "D2", "High Energy Discharge"
        
        # Zone T1 - Thermal Fault < 300°C
        elif pC2H4 >= 20 and pC2H4 < 40 and pC2H2 < 4 and pC2H6 < 20:
            return "T1", "Thermal Fault < 300°C"
        
        # Zone T2 - Thermal Fault 300-700°C
        elif pC2H4 >= 40 and pC2H4 < 60 and pC2H2 < 4:
            return "T2", "Thermal Fault 300-700°C"
        
        # Zone T3 - Thermal Fault > 700°C
        elif pC2H4 >= 60 and pC2H2 < 4:
            return "T3", "Thermal Fault > 700°C"
        
        # Zone S - Stray Gassing
        elif pC2H4 >= 20 and pC2H4 < 40 and pC2H6 > 20:
            return "S", "Stray Gassing"
        
        # Zone N - Normal
        elif pC2H2 < 4 and pC2H4 < 20 and pC2H6 < 20 and pH2 < 50:
            return "N", "Normal Operation"
        
        # Zone O - Overheating
        else:
            return "O", "Overheating"
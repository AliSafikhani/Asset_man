from typing import Dict, Any, List
from algorithms.base_algorithm import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils

class IECRatio(BaseAlgorithm):
    """IEC 60599 Ratio Method for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="IEC Ratio Method",
            description="IEC 60599 Ratio Method based on C2H2/C2H4, CH4/H2, C2H4/C2H6",
            version="1.0"
        )
        self.gas_utils = GasUtils()
    
    def get_required_parameters(self) -> List[str]:
        return ['ch4', 'c2h2', 'c2h4', 'c2h6', 'h2']
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate IEC Ratios"""
        
        # Extract gas values
        ch4 = self.gas_utils.get_gas_value(parameters, 'ch4')
        c2h2 = self.gas_utils.get_gas_value(parameters, 'c2h2')
        c2h4 = self.gas_utils.get_gas_value(parameters, 'c2h4')
        c2h6 = self.gas_utils.get_gas_value(parameters, 'c2h6')
        h2 = self.gas_utils.get_gas_value(parameters, 'h2')
        
        # Calculate ratios (avoid division by zero)
        r1 = c2h2 / c2h4 if c2h4 > 0 else 0
        r2 = ch4 / h2 if h2 > 0 else 0
        r3 = c2h4 / c2h6 if c2h6 > 0 else 0
        
        # Determine fault
        code, fault = self._determine_fault(r1, r2, r3)
        
        return {
            "code": code,
            "fault": fault,
            "ratios": {
                "R1 (C2H2/C2H4)": round(r1, 3),
                "R2 (CH4/H2)": round(r2, 3),
                "R3 (C2H4/C2H6)": round(r3, 3)
            }
        }
    
    def _determine_fault(self, r1: float, r2: float, r3: float) -> tuple:
        """Determine IEC ratio fault code"""
        
        # IEC 60599 Ratio Codes
        if r1 < 0.1 and r2 < 0.1 and r3 < 1.0:
            return "1", "PD - Partial Discharge"
        elif r1 < 0.1 and r2 > 0.1 and r2 < 1.0 and r3 < 1.0:
            return "2", "T1 - Thermal Fault < 300°C"
        elif r1 < 0.1 and r2 > 1.0 and r3 < 1.0:
            return "3", "T2 - Thermal Fault 300-700°C"
        elif r1 < 0.1 and r2 > 1.0 and r3 > 1.0:
            return "4", "T3 - Thermal Fault > 700°C"
        elif r1 > 0.1 and r1 < 1.0 and r2 < 0.1 and r3 < 1.0:
            return "5", "D1 - Low Energy Discharge"
        elif r1 > 1.0 and r2 > 0.1 and r2 < 1.0 and r3 < 1.0:
            return "6", "D2 - High Energy Discharge"
        elif r1 > 1.0 and r2 > 1.0 and r3 < 1.0:
            return "7", "DT - Thermal/Discharge Mixed"
        else:
            return "0", "Normal"
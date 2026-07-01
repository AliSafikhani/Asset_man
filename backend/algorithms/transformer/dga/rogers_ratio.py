from typing import Dict, Any, List
from algorithms.base_algorithm import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils

class RogersRatio(BaseAlgorithm):
    """Rogers Ratio Method for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Rogers Ratio",
            description="Rogers Ratio Method based on CH4/H2, C2H2/C2H4, C2H2/CH4, C2H6/C2H4",
            version="1.0"
        )
        self.gas_utils = GasUtils()
    
    def get_required_parameters(self) -> List[str]:
        return ['ch4', 'c2h2', 'c2h4', 'c2h6', 'h2']
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Rogers Ratios"""
        
        # Extract gas values
        ch4 = self.gas_utils.get_gas_value(parameters, 'ch4')
        c2h2 = self.gas_utils.get_gas_value(parameters, 'c2h2')
        c2h4 = self.gas_utils.get_gas_value(parameters, 'c2h4')
        c2h6 = self.gas_utils.get_gas_value(parameters, 'c2h6')
        h2 = self.gas_utils.get_gas_value(parameters, 'h2')
        
        # Calculate ratios (avoid division by zero)
        r1 = ch4 / h2 if h2 > 0 else 0
        r2 = c2h2 / c2h4 if c2h4 > 0 else 0
        r3 = c2h2 / ch4 if ch4 > 0 else 0
        r4 = c2h6 / c2h4 if c2h4 > 0 else 0
        
        # Determine fault code
        code, status = self._determine_fault(r1, r2, r3, r4)
        
        return {
            "code": code,
            "status": status,
            "ratios": {
                "R1 (CH4/H2)": round(r1, 3),
                "R2 (C2H2/C2H4)": round(r2, 3),
                "R3 (C2H2/CH4)": round(r3, 3),
                "R4 (C2H6/C2H4)": round(r4, 3)
            }
        }
    
    def _determine_fault(self, r1: float, r2: float, r3: float, r4: float) -> tuple:
        """Determine Rogers Ratio fault code"""
        
        # Rogers Ratio Codes
        if r1 < 0.1 and r2 > 0.1 and r2 < 0.4:
            return "1", "Normal Operation"
        elif r1 > 0.1 and r1 < 1.0 and r2 > 0.1 and r2 < 0.4:
            return "2", "Partial Discharge"
        elif r1 > 1.0 and r2 > 0.1 and r2 < 0.4:
            return "3", "Thermal Fault"
        elif r1 > 1.0 and r2 > 0.4:
            return "4", "High Energy Discharge"
        elif r1 < 0.1 and r2 > 0.4:
            return "5", "Low Energy Discharge"
        else:
            return "?", "Uncertain"
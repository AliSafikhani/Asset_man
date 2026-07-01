from typing import Dict, Any, List
from algorithms.base_algorithm import BaseAlgorithm
from algorithms.common.gas_utils import GasUtils

class KeyGas(BaseAlgorithm):
    """Key Gas Method for DGA Interpretation"""
    
    def __init__(self):
        super().__init__(
            name="Key Gas Method",
            description="Key Gas Method comparing gas levels against limits",
            version="1.0"
        )
        self.gas_utils = GasUtils()
        # Gas limits (ppm)
        self.gas_limits = {
            'h2': 100,
            'ch4': 50,
            'c2h2': 10,
            'c2h4': 20,
            'c2h6': 30,
            'co': 250,
            'co2': 3000
        }
    
    def get_required_parameters(self) -> List[str]:
        return ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2']
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Key Gas results"""
        
        # Extract gas values
        gases = {}
        exceeded_gases = []
        
        for gas_name, limit in self.gas_limits.items():
            value = self.gas_utils.get_gas_value(parameters, gas_name)
            gases[gas_name] = value
            if value > limit:
                exceeded_gases.append({
                    "name": gas_name.upper(),
                    "value": value,
                    "limit": limit
                })
        
        total_gases = sum(gases.values())
        
        # Determine fault type
        fault, status = self._determine_fault(gases, exceeded_gases)
        
        return {
            "fault": fault,
            "status": status,
            "gas_values": gases,
            "total_gases": round(total_gases, 1),
            "exceeded_gases": exceeded_gases,
            "limits": self.gas_limits
        }
    
    def _determine_fault(self, gases: Dict[str, float], 
                         exceeded: List[Dict]) -> tuple:
        """Determine fault type based on key gases"""
        
        if len(exceeded) == 0:
            return "Normal", "All gases within normal limits"
        
        # Check for specific fault types
        exceeded_names = [g['name'] for g in exceeded]
        
        if 'C2H2' in exceeded_names and gases.get('c2h2', 0) > 10:
            return "High Energy Discharge", "Arc/Spark discharge detected"
        elif 'H2' in exceeded_names and gases.get('h2', 0) > 100:
            return "Low Energy Discharge", "Partial discharge or corona"
        elif 'C2H4' in exceeded_names or 'C2H6' in exceeded_names:
            return "Thermal Fault", "Overheating detected"
        elif 'CO' in exceeded_names and gases.get('co', 0) > 250:
            return "Cellulose Degradation", "Paper insulation overheating"
        else:
            return "Mixed Fault", "Multiple gases exceeding limits"
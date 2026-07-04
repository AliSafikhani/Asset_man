from typing import Dict, Any

class GasUtils:
    """Utility functions for gas calculations"""
    
    @staticmethod
    def get_gas_value(parameters: Dict[str, Any], gas_name: str) -> float:
        return float(parameters.get(gas_name, 0) or 0)
    
    @staticmethod
    def calculate_percentages(gases: Dict[str, float]) -> Dict[str, float]:
        total = sum(gases.values())
        if total == 0:
            total = 0.0001
        return {key: (value / total) * 100 for key, value in gases.items()}

from typing import Dict, Any, List, Optional

class GasUtils:
    """Utility functions for gas calculations"""
    
    @staticmethod
    def get_gas_value(parameters: Dict[str, Any], gas_name: str) -> float:
        """Get gas value from parameters"""
        return float(parameters.get(gas_name, 0) or 0)
    
    @staticmethod
    def get_gas_percentages(gases: Dict[str, float]) -> Dict[str, float]:
        """Calculate percentages of gases"""
        total = sum(gases.values())
        if total == 0:
            return {key: 0 for key in gases.keys()}
        return {key: (value / total) * 100 for key, value in gases.items()}
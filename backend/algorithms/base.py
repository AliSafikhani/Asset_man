from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAlgorithm(ABC):
    """Base class for all algorithms"""
    
    def __init__(self, name: str, description: str, version: str = "1.0"):
        self.name = name
        self.description = description
        self.version = version
        self.asset_type = "transformer"
        self.test_type = "dga"
    
    @abstractmethod
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate algorithm results"""
        pass
    
    @abstractmethod
    def get_required_parameters(self) -> List[str]:
        """Get list of required parameter names"""
        pass
    
    @abstractmethod
    def get_visualization_type(self) -> str:
        """Return: '2d', '3d', 'trend', or 'none'"""
        pass
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        required = self.get_required_parameters()
        for param in required:
            if param not in parameters or parameters[param] is None:
                return False
        return True
    
    def get_info(self) -> Dict[str, Any]:
        return {
            "id": self.__class__.__name__.lower(),
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "asset_type": self.asset_type,
            "test_type": self.test_type,
            "required_parameters": self.get_required_parameters(),
            "visualization_type": self.get_visualization_type()
        }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate for multiple samples"""
        results = []
        for sample in samples:
            gas_data = sample.get('gas_data', {})
            params = {key: gas_data.get(key, 0) for key in self.get_required_parameters()}
            result = self.calculate(params)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            results.append(result)
        return results

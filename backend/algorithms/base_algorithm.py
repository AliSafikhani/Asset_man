from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAlgorithm(ABC):
    """Base class for all algorithms"""
    
    def __init__(self, name: str, description: str, version: str = "1.0"):
        self.name = name
        self.description = description
        self.version = version
    
    @abstractmethod
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate algorithm results based on parameters"""
        pass
    
    @abstractmethod
    def get_required_parameters(self) -> List[str]:
        """Get list of required parameter names"""
        pass
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate that all required parameters are present"""
        required = self.get_required_parameters()
        for param in required:
            if param not in parameters or parameters[param] is None:
                return False
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """Get algorithm information"""
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "required_parameters": self.get_required_parameters()
        }
from typing import Dict, Any, List, Optional
from algorithms.base import BaseAlgorithm

from algorithms.transformer.dga.duval_triangle_1 import DuvalTriangle1
from algorithms.transformer.dga.duval_triangle_2 import DuvalTriangle2
from algorithms.transformer.dga.duval_triangle_4 import DuvalTriangle4
from algorithms.transformer.dga.duval_triangle_5 import DuvalTriangle5
from algorithms.transformer.dga.duval_triangle_6 import DuvalTriangle6
from algorithms.transformer.dga.duval_pentagon_1 import DuvalPentagon1
from algorithms.transformer.dga.duval_pentagon_2 import DuvalPentagon2
from algorithms.transformer.dga.rogers_ratio import RogersRatio
from algorithms.transformer.dga.doernenburg_ratio import DoernenburgRatio
from algorithms.transformer.dga.iec60599_ratio import IEC60599Ratio  # Added


class AlgorithmManager:
    def __init__(self):
        self.algorithms: Dict[str, Dict[str, Dict[str, BaseAlgorithm]]] = {}
        self._register_algorithms()
    
    def _register_algorithms(self):
        print("ط¸â€¹ط¹ط›أ¢â‚¬إ“أ¢â‚¬إ’ Registering algorithms...")
        self.algorithms['transformer'] = {
            'dga': {
                'duval_triangle_1': DuvalTriangle1(),
                'duval_triangle_2': DuvalTriangle2(),
                'duval_triangle_4': DuvalTriangle4(),
                'duval_triangle_5': DuvalTriangle5(),
                'duval_triangle_6': DuvalTriangle6(),
                'duval_pentagon_1': DuvalPentagon1(),
                'duval_pentagon_2': DuvalPentagon2(),
                'rogers_ratio': RogersRatio(),
                'doernenburg_ratio': DoernenburgRatio(),
                'iec60599_ratio': IEC60599Ratio(),  # Added
            }
        }
        print("ط£آ¢ط¥â€œأ¢â‚¬آ¦ Registered transformer/dga algorithms")
        print(f"   Algorithms: {list(self.algorithms['transformer']['dga'].keys())}")
    
    def get_algorithms(self, asset_type: str, test_type: str) -> List[Dict[str, Any]]:
        algorithms = []
        if asset_type in self.algorithms and test_type in self.algorithms[asset_type]:
            for name, algo in self.algorithms[asset_type][test_type].items():
                algorithms.append(algo.get_info())
        return algorithms
    
    def calculate(self, asset_type: str, test_type: str, algorithm_id: str, 
                  parameters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if (asset_type in self.algorithms and 
            test_type in self.algorithms[asset_type] and 
            algorithm_id in self.algorithms[asset_type][test_type]):
            algorithm = self.algorithms[asset_type][test_type][algorithm_id]
            if not algorithm.validate_parameters(parameters):
                return {
                    "error": "Missing required parameters",
                    "required": algorithm.get_required_parameters()
                }
            return algorithm.calculate(parameters)
        return None
    
    def calculate_batch(self, asset_type: str, test_type: str, algorithm_id: str, 
                        samples: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        if (asset_type in self.algorithms and 
            test_type in self.algorithms[asset_type] and 
            algorithm_id in self.algorithms[asset_type][test_type]):
            algorithm = self.algorithms[asset_type][test_type][algorithm_id]
            return algorithm.calculate_batch(samples)
        return None
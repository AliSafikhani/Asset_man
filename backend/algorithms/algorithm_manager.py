from typing import Dict, Any, List, Optional
from algorithms.base_algorithm import BaseAlgorithm

# Try to import DGA algorithms
try:
    from algorithms.transformer.dga.duval_triangle_1 import DuvalTriangle1
    DGA_ALGORITHMS_AVAILABLE = True
    print("✅ DuvalTriangle1 imported successfully in algorithm_manager")
except ImportError as e:
    print(f"❌ DGA algorithms not available: {e}")
    DGA_ALGORITHMS_AVAILABLE = False

class AlgorithmManager:
    """Manager for all algorithms"""
    
    def __init__(self):
        self.algorithms: Dict[str, Dict[str, BaseAlgorithm]] = {}
        print("🔧 Initializing AlgorithmManager...")
        self._register_algorithms()
    
    def _register_algorithms(self):
        """Register all available algorithms"""
        print(f"📝 Registering algorithms... DGA_ALGORITHMS_AVAILABLE = {DGA_ALGORITHMS_AVAILABLE}")
        
        if not DGA_ALGORITHMS_AVAILABLE:
            print("⚠️  DGA algorithms not available - using mock data")
            return
        
        # DGA algorithms for transformer
        try:
            dga_algorithms = {
                'duval_triangle_1': DuvalTriangle1(),
            }
            print(f"✅ Created dga_algorithms: {list(dga_algorithms.keys())}")
            
            self.algorithms['transformer'] = {'dga': dga_algorithms}
            print(f"✅ Registered transformer/dga")
            
            # Add DGA algorithms for other assets (same algorithms)
            for asset in ['generator', 'motor']:
                if asset not in self.algorithms:
                    self.algorithms[asset] = {}
                self.algorithms[asset]['dga'] = dga_algorithms
                print(f"✅ Registered {asset}/dga")
            
            print(f"✅ All algorithms registered successfully")
            print(f"   Available: {list(self.algorithms.keys())}")
        except Exception as e:
            print(f"❌ Error registering algorithms: {e}")
            import traceback
            traceback.print_exc()
    
    def get_algorithms(self, asset_type: str, test_type: str) -> List[Dict[str, Any]]:
        """Get all algorithms for a specific asset and test type"""
        algorithms = []
        
        if asset_type in self.algorithms and test_type in self.algorithms[asset_type]:
            for name, algo in self.algorithms[asset_type][test_type].items():
                algorithms.append({
                    "id": name,
                    "name": algo.name,
                    "description": algo.description,
                    "version": algo.version,
                    "required_parameters": algo.get_required_parameters()
                })
        
        return algorithms
    
    def calculate(self, asset_type: str, test_type: str, algorithm_id: str, 
                  parameters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Calculate algorithm results"""
        
        if (asset_type in self.algorithms and 
            test_type in self.algorithms[asset_type] and 
            algorithm_id in self.algorithms[asset_type][test_type]):
            
            algorithm = self.algorithms[asset_type][test_type][algorithm_id]
            
            # Validate parameters
            if not algorithm.validate_parameters(parameters):
                return {
                    "error": "Missing required parameters",
                    "required": algorithm.get_required_parameters()
                }
            
            # Calculate results
            return algorithm.calculate(parameters)
        
        return None
    
    def calculate_all(self, asset_type: str, test_type: str, 
                      parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate all algorithms for a specific asset and test type"""
        
        results = {}
        
        if asset_type in self.algorithms and test_type in self.algorithms[asset_type]:
            for name, algorithm in self.algorithms[asset_type][test_type].items():
                if algorithm.validate_parameters(parameters):
                    results[name] = algorithm.calculate(parameters)
                else:
                    results[name] = {
                        "error": "Missing required parameters",
                        "required": algorithm.get_required_parameters()
                    }
        
        return results
    
    def calculate_duval_triangle1_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate Duval Triangle 1 for multiple samples (batch processing)"""
        print(f"\n🔍 calculate_duval_triangle1_batch called with {len(samples)} samples")
        print(f"Current algorithms: {self.algorithms}")
        
        # Check if transformer/dga exists
        if 'transformer' not in self.algorithms:
            print("❌ Transformer not found in algorithms")
            return []
        
        if 'dga' not in self.algorithms['transformer']:
            print("❌ DGA not found in transformer algorithms")
            return []
        
        # Get the algorithm
        algorithm = self.algorithms['transformer']['dga'].get('duval_triangle_1')
        if not algorithm:
            print("❌ Duval Triangle 1 algorithm not found")
            print(f"Available in dga: {list(self.algorithms['transformer']['dga'].keys())}")
            return []
        
        print(f"✅ Algorithm found: {algorithm}")
        
        # Calculate for each sample
        results = []
        for idx, sample in enumerate(samples):
            try:
                print(f"\n📊 Processing sample {idx + 1}: {sample}")
                
                # Extract gas data
                gas_data = sample.get('gas_data', {})
                print(f"   gas_data: {gas_data}")
                
                # Prepare parameters
                params = {
                    'ch4': gas_data.get('ch4', 0),
                    'c2h2': gas_data.get('c2h2', 0),
                    'c2h4': gas_data.get('c2h4', 0),
                }
                print(f"   params: {params}")
                
                # Calculate
                result = algorithm.calculate(params)
                print(f"   result: {result}")
                
                # Add metadata
                result['id'] = sample.get('id')
                result['sample_date'] = sample.get('sample_date')
                
                results.append(result)
                print(f"   ✅ Added result for sample {idx + 1}")
                
            except Exception as e:
                print(f"   ❌ Error processing sample {idx + 1}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"\n✅ Returning {len(results)} results")
        return results
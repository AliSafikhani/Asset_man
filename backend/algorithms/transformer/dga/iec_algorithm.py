# backend/algorithms/transformer/dga/iec_algorithm.py

"""
IEC DGA Algorithm
Simplified DGA interpretation based on IEC standards
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import numpy as np
from algorithms.base import BaseAlgorithm
from .IEC_processor import IECProcessor
from .zones import IECStatus


class IECAlgorithm(BaseAlgorithm):
    """IEC DGA Algorithm for transformer condition monitoring"""
    
    def __init__(self):
        super().__init__(
            name="IEC DGA",
            description="IEC based DGA interpretation for transformer condition monitoring",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
    
    def get_required_parameters(self) -> List[str]:
        return ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2', 'co', 'co2', 'o2', 'n2']
    
    def get_visualization_type(self) -> str:
        return "table"
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "fault_type": IECStatus.UNKNOWN,
            "fault_name": "Requires Multiple Samples",
            "zone_color": IECStatus.ZONE_COLORS.get(IECStatus.UNKNOWN, "#95A5A6"),
            "status_code": 0,
            "status": "Unknown"
        }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculate IEC status for multiple samples.
        """
        print(f"\n📦 IECAlgorithm.calculate_batch() called with {len(samples)} samples")
        
        if len(samples) < 2:
            print(f"   ⚠️ Need at least 2 samples for IEC analysis")
            results = []
            for sample in samples:
                results.append({
                    "fault_type": IECStatus.UNKNOWN,
                    "fault_name": "Need at least 2 samples",
                    "zone_color": IECStatus.ZONE_COLORS.get(IECStatus.UNKNOWN, "#95A5A6"),
                    "status_code": 0,
                    "status": "Unknown",
                    "id": sample.get('id'),
                    "sample_date": sample.get('sample_date')
                })
            return results
        
        try:
            # Prepare data for the processor
            n_samples = len(samples)
            
            # Create samples matrix: [H2, O2, N2, CO, CO2, CH4, C2H4, C2H6, C2H2]
            samples_matrix = [[0.0 for _ in range(n_samples)] for _ in range(9)]
            
            # Get dates and calculate days
            dates = []
            for i, sample in enumerate(samples):
                gas_data = sample.get('gas_data', {})
                samples_matrix[0][i] = float(gas_data.get('h2', 0))
                samples_matrix[1][i] = float(gas_data.get('o2', 0))
                samples_matrix[2][i] = float(gas_data.get('n2', 0))
                samples_matrix[3][i] = float(gas_data.get('co', 0))
                samples_matrix[4][i] = float(gas_data.get('co2', 0))
                samples_matrix[5][i] = float(gas_data.get('ch4', 0))
                samples_matrix[6][i] = float(gas_data.get('c2h4', 0))
                samples_matrix[7][i] = float(gas_data.get('c2h6', 0))
                samples_matrix[8][i] = float(gas_data.get('c2h2', 0))
                
                # Parse date
                date_str = sample.get('sample_date')
                if date_str:
                    try:
                        dates.append(datetime.strptime(date_str, "%Y-%m-%d"))
                    except ValueError:
                        try:
                            dates.append(datetime.strptime(date_str, "%Y/%m/%d"))
                        except ValueError:
                            dates.append(datetime.now())
                else:
                    dates.append(datetime.now())
            
            # Calculate days from first sample
            first_date = dates[0]
            days_list = [float((date - first_date).days) for date in dates]
            
            # Convert to numpy arrays
            samples_np = np.array(samples_matrix)
            days_np = np.array(days_list)
            
            # Create IECProcessor instance
            processor = IECProcessor()
            
            # Call the IEC_DETECTION method
            status_codes = processor.IEC_DETECTION(
                samples_np,
                days_np
            )
            
            # Format results
            formatted_results = []
            for i, sample in enumerate(samples):
                status_code = int(status_codes[i]) if i < len(status_codes) else 0
                
                # Map status code to name
                if status_code == 2:
                    status = "Investigate"
                    fault_name = "Investigate - Monitor Closely"
                    zone_color = "#FF9800"
                elif status_code == 4:
                    status = "Action Required"
                    fault_name = "Action Required - Immediate Attention"
                    zone_color = "#f44336"
                else:
                    status = "Unknown"
                    fault_name = "Unable to Determine"
                    zone_color = "#95A5A6"
                
                formatted_results.append({
                    "fault_type": status.upper().replace(' ', '_'),
                    "fault_name": fault_name,
                    "zone_color": zone_color,
                    "status_code": status_code,
                    "status": status,
                    "id": sample.get('id'),
                    "sample_date": sample.get('sample_date')
                })
            
            print(f"   ✅ IEC analysis complete: {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            print(f"   ❌ Error in IEC analysis: {e}")
            import traceback
            traceback.print_exc()
            
            results = []
            for sample in samples:
                results.append({
                    "fault_type": "UNKNOWN",
                    "fault_name": "Analysis Error",
                    "zone_color": "#95A5A6",
                    "status_code": 0,
                    "status": "Unknown",
                    "id": sample.get('id'),
                    "sample_date": sample.get('sample_date')
                })
            return results
"""
Algorithms API Endpoints
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/health")
async def algorithms_health(request: Request):
    """Check if algorithms are available"""
    algorithm_manager = getattr(request.app.state, 'algorithm_manager', None)
    return {
        "status": "available" if algorithm_manager else "unavailable",
        "algorithm_manager": str(algorithm_manager)
    }

@router.post("/dga/analyze")
async def analyze_dga(request: Request, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze DGA data using algorithms
    """
    try:
        # Get algorithm manager from app state
        algorithm_manager = getattr(request.app.state, 'algorithm_manager', None)
        
        if algorithm_manager is None:
            logger.warning("Algorithm Manager is None - using mock data")
            # Return mock data for testing
            return get_mock_dga_results(data)
        
        # Get parameters
        asset_type = data.get('asset_type', 'transformer')
        parameters = data.get('parameters', {})
        
        logger.info(f"Analyzing DGA for asset_type: {asset_type}")
        logger.info(f"Parameters: {parameters}")
        
        # Calculate with actual algorithm manager
        results = algorithm_manager.calculate_all(asset_type, 'dga', parameters)
        
        if not results:
            logger.warning(f"No algorithms found for {asset_type}/dga")
            return get_mock_dga_results(data)
        
        # Determine overall status
        overall_status = determine_overall_status(results)
        
        return {
            "algorithms": results,
            "overall_status": overall_status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error calculating algorithms: {e}")
        return {
            "error": str(e),
            "message": "Error calculating algorithms - using mock data",
            "algorithms": get_mock_algorithms()
        }

def get_mock_dga_results(data):
    """Return mock DGA results for testing"""
    return {
        "algorithms": get_mock_algorithms(),
        "overall_status": {
            "status": "Normal",
            "color": "#4CAF50",
            "level": "Normal Operation"
        },
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Using mock data - Algorithm Manager not available"
    }

def get_mock_algorithms():
    """Return mock algorithm results"""
    return {
        "duval_triangle_1": {
            "zone": "N",
            "status": "Normal Operation",
            "percentages": {"CH4": 50.0, "C2H2": 10.0, "C2H4": 40.0}
        },
        "duval_pentagon": {
            "zone": "N",
            "status": "Normal Operation",
            "percentages": {"CH4": 30.0, "C2H2": 10.0, "C2H4": 20.0, "C2H6": 20.0, "H2": 20.0}
        },
        "rogers_ratio": {
            "code": "1",
            "status": "Normal Operation",
            "ratios": {"R1": 0.5, "R2": 0.2, "R3": 0.1, "R4": 0.3}
        },
        "key_gas": {
            "fault": "Normal",
            "status": "All gases within normal limits"
        },
        "iec_ratio": {
            "code": "0",
            "fault": "Normal",
            "ratios": {"R1": 0.1, "R2": 0.2, "R3": 0.5}
        }
    }

def determine_overall_status(results: Dict[str, Any]) -> Dict[str, Any]:
    """Determine overall status based on all algorithm results"""
    statuses = []
    
    for algo_name, result in results.items():
        if "error" in result:
            continue
        
        if algo_name == "duval_triangle_1" or algo_name == "duval_pentagon":
            statuses.append(result.get("zone", ""))
        elif algo_name == "rogers_ratio":
            statuses.append(result.get("code", ""))
        elif algo_name == "key_gas":
            statuses.append(result.get("fault", ""))
        elif algo_name == "iec_ratio":
            statuses.append(result.get("code", ""))
    
    critical = ['D2', 'T3', '6', '7', 'High Energy Discharge', 'Thermal Fault']
    warning = ['D1', 'T2', 'PD', '1', '2', '5']
    
    has_critical = any(s in critical for s in statuses if s)
    has_warning = any(s in warning for s in statuses if s)
    
    if has_critical:
        return {
            "status": "Critical",
            "color": "#f44336",
            "level": "Immediate Action Required"
        }
    elif has_warning:
        return {
            "status": "Warning",
            "color": "#FF9800",
            "level": "Monitor Closely"
        }
    else:
        return {
            "status": "Normal",
            "color": "#4CAF50",
            "level": "Normal Operation"
        }
    
@router.post("/dga/duval-triangle-1/batch")
async def calculate_duval_triangle1_batch(
    request: Request,
    samples: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Calculate Duval Triangle 1 for multiple samples (batch processing)
    """
    try:
        algorithm_manager = getattr(request.app.state, 'algorithm_manager', None)
        
        if algorithm_manager is None:
            raise HTTPException(status_code=503, detail="Algorithm Manager not initialized")
        
        results = algorithm_manager.calculate_duval_triangle1_batch(samples)
        
        if not results:
            raise HTTPException(status_code=404, detail="No results calculated")
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
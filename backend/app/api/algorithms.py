"""
Algorithms API Routes
DGA and other test interpretation algorithms
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List, Dict, Any
from datetime import datetime
import logging

from algorithms import AlgorithmManager

logger = logging.getLogger(__name__)

# NO PREFIX HERE - prefix will be added in v1/api.py
router = APIRouter(tags=["algorithms"])
manager = AlgorithmManager()


@router.post("/{asset_type}/{test_type}/{algorithm_id}/batch")
async def calculate_batch(
    asset_type: str,
    test_type: str,
    algorithm_id: str,
    samples: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Calculate algorithm for multiple samples
    """
    print(f"\n🚀 {algorithm_id} Batch: Processing {len(samples)} samples")
    print(f"   Asset: {asset_type}, Test: {test_type}")
    
    results = manager.calculate_batch(asset_type, test_type, algorithm_id, samples)
    
    if results is None:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    print(f"✅ Returning {len(results)} results")
    return results


@router.post("/{asset_type}/{test_type}/{algorithm_id}")
async def calculate_single(
    asset_type: str,
    test_type: str,
    algorithm_id: str,
    parameters: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate algorithm for a single sample
    """
    print(f"\n🚀 {algorithm_id} Single: Processing one sample")
    print(f"   Asset: {asset_type}, Test: {test_type}")
    
    result = manager.calculate(asset_type, test_type, algorithm_id, parameters)
    
    if result is None:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/{asset_type}/{test_type}")
async def get_algorithms(
    asset_type: str,
    test_type: str
) -> List[Dict[str, Any]]:
    """
    Get all algorithms for a specific asset and test type
    """
    print(f"\n🔍 Getting algorithms for {asset_type}/{test_type}")
    algorithms = manager.get_algorithms(asset_type, test_type)
    
    if not algorithms:
        print(f"❌ No algorithms found for {asset_type}/{test_type}")
        raise HTTPException(
            status_code=404, 
            detail=f"No algorithms found for {asset_type}/{test_type}"
        )
    
    print(f"✅ Found {len(algorithms)} algorithms")
    return algorithms


@router.get("/info")
async def get_all_algorithms_info() -> Dict[str, Any]:
    """
    Get all registered algorithms
    """
    return {
        asset: {
            test: list(algo.keys()) 
            for test, algo in tests.items()
        }
        for asset, tests in manager.algorithms.items()
    }


@router.get("/health")
async def algorithms_health():
    """Check if algorithms are available"""
    return {
        "status": "available",
        "message": "DGA algorithms are working",
        "version": "1.0",
        "registered_assets": list(manager.algorithms.keys())
    }
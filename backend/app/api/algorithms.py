"""
Algorithms API Routes - Using Direct Calculation
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime
import logging

from app.api.dga_utils import DGACalculator

logger = logging.getLogger(__name__)

# Remove prefix here since we'll add it in main.py
router = APIRouter(tags=["algorithms"])


@router.post("/dga/duval-triangle-1/batch")
async def calculate_duval_triangle1_batch(samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Calculate Duval Triangle 1 for multiple samples"""
    print(f"\n🚀 Duval Triangle 1 Batch: Processing {len(samples)} samples")
    results = DGACalculator.calculate_duval_triangle1_batch(samples)
    print(f"✅ Returning {len(results)} results")
    return results


@router.post("/dga/analyze")
async def analyze_dga(data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze DGA data using all algorithms"""
    print(f"\n🔍 Analyzing DGA data")
    parameters = data.get('parameters', {})
    
    duval_result = DGACalculator.calculate_duval_triangle1(
        parameters.get('ch4', 0),
        parameters.get('c2h2', 0),
        parameters.get('c2h4', 0)
    )
    
    zone = duval_result.get('fault_zone', 'UNK')
    if zone in ['N', 'PD']:
        overall = {"status": "Normal", "color": "#4CAF50", "level": "Normal Operation"}
    elif zone in ['T1', 'T2', 'S']:
        overall = {"status": "Warning", "color": "#FF9800", "level": "Monitor Closely"}
    else:
        overall = {"status": "Critical", "color": "#f44336", "level": "Immediate Action Required"}
    
    return {
        "algorithms": {"duval_triangle_1": duval_result},
        "overall_status": overall,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health")
async def algorithms_health():
    return {"status": "available", "message": "DGA algorithms are working"}
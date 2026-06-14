"""
Test datasets endpoints - Simplified placeholder
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/test-datasets", tags=["Test Datasets"])


@router.get("")
async def list_datasets(
    user_id: Optional[int] = Depends(get_current_user_id),
    skip: int = 0,
    limit: int = 100
):
    """List all test datasets"""
    return {
        "items": [],
        "total": 0,
        "message": "Test datasets endpoint - database not yet configured"
    }


@router.get("/{dataset_id}")
async def get_dataset(
    dataset_id: int,
    user_id: Optional[int] = Depends(get_current_user_id)
):
    """Get a specific dataset"""
    return {
        "id": dataset_id,
        "name": f"Dataset {dataset_id}",
        "message": "Test datasets endpoint - database not yet configured"
    }


@router.post("", status_code=201)
async def create_dataset(
    name: str,
    user_id: Optional[int] = Depends(get_current_user_id)
):
    """Create a test dataset"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return {
        "id": 1,
        "name": name,
        "created_by": user_id,
        "message": "Dataset created - database not yet configured"
    }
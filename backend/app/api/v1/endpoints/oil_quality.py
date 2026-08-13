# backend/app/api/v1/endpoints/oil_quality.py
# Live IEC 60296 + IEC 60422:2024 oil-quality assessment endpoints for
# transformers. Mounted at /api/v1/oil-quality. Mirrors the diagnostics.py
# pattern: thin endpoints over OilQualityService, computed live (not stored),
# envelope {asset_id, status:"success", data}. 404 when there are no Oil Quality
# tests for the asset (or, for /trend, fewer than 2).

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.oil_quality_service import OilQualityService

router = APIRouter(tags=["Oil Quality"])


@router.get("/transformer/{asset_id}/status")
async def get_oil_quality_statuses(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Per-test IEC 60296 / IEC 60422 statuses for the Test Results list table."""
    service = OilQualityService()
    results = await service.per_test_statuses(db, asset_id)
    if results is None:
        raise HTTPException(
            status_code=404,
            detail="No Oil Quality tests found for this transformer",
        )
    return {"asset_id": asset_id, "status": "success", "data": results}


@router.get("/transformer/{asset_id}/assess/{test_result_id}")
async def assess_oil_quality_test(
    asset_id: int,
    test_result_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Full analyze dashboard for a single Oil Quality test (with embedded trend)."""
    service = OilQualityService()
    result = await service.assess_one(db, asset_id, test_result_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Oil Quality test not found for this transformer",
        )
    return {"asset_id": asset_id, "status": "success", "data": result}


@router.get("/transformer/{asset_id}/trend")
async def get_oil_quality_trend(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Trend analysis over the whole series of the transformer's Oil Quality tests."""
    service = OilQualityService()
    result = await service.trend(db, asset_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Insufficient Oil Quality tests (min 2) for trend analysis",
        )
    return {"asset_id": asset_id, "status": "success", "data": result}

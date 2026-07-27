from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.ieee_service import IEEEService

router = APIRouter( tags=["Diagnostics"])

@router.get("/transformer/{asset_id}/ieee")
async def get_ieee_status_live(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get live IEEE C57.104-2019 status for a transformer.
    Calculated on-demand using all DGA samples. Not stored.
    """
    service = IEEEService()
    results = await service.calculate_ieee_status(db, asset_id)
    if results is None:
        raise HTTPException(
            status_code=404,
            detail="Insufficient DGA samples (min 2) or transformer not found"
        )
    return {
        "asset_id": asset_id,
        "status": "success",
        "data": results
    }

@router.get("/test")
async def test():
    return {"message": "Diagnostics router is working!"}

@router.get("/ping")
async def ping():
    return {"message": "pong"}
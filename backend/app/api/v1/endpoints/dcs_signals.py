from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter()

# Pydantic models
class DCSignalBase(BaseModel):
    kks_code: str
    signal_name: str
    unit: Optional[str] = None
    description: Optional[str] = None

class DCSignalResponse(DCSignalBase):
    id: int
    plant_id: int
    is_assigned: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AssetDCSMappingCreate(BaseModel):
    asset_id: int
    dcs_signal_id: int
    display_name: str
    unit: Optional[str] = None
    min_alarm: Optional[float] = None
    max_alarm: Optional[float] = None

class AssetDCSMappingResponse(BaseModel):
    id: int
    asset_id: int
    dcs_signal_id: int
    display_name: str
    unit: Optional[str]
    min_alarm: Optional[float]
    max_alarm: Optional[float]
    is_active: bool
    signal_details: Optional[DCSignalResponse] = None

    class Config:
        from_attributes = True


@router.get("/signals/plant/{plant_id}", response_model=List[DCSignalResponse])
async def get_plant_signals(
    plant_id: int,
    assigned_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """Get all DCS signals for a plant"""
    from app.models.dcs_models import DCSignal
    
    query = select(DCSignal).where(DCSignal.plant_id == plant_id)
    if assigned_only:
        query = query.where(DCSignal.is_assigned == True)
    result = await db.execute(query)
    signals = result.scalars().all()
    return signals


@router.get("/signals/unassigned/plant/{plant_id}", response_model=List[DCSignalResponse])
async def get_unassigned_signals(
    plant_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get unassigned DCS signals for a plant"""
    from app.models.dcs_models import DCSignal
    
    result = await db.execute(
        select(DCSignal).where(
            and_(
                DCSignal.plant_id == plant_id,
                DCSignal.is_assigned == False
            )
        )
    )
    signals = result.scalars().all()
    return signals


@router.get("/asset/{asset_id}/mappings", response_model=List[AssetDCSMappingResponse])
async def get_asset_dcs_mappings(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all DCS mappings for an asset"""
    from app.models.dcs_models import AssetDCSMapping, DCSignal
    
    result = await db.execute(
        select(AssetDCSMapping).where(AssetDCSMapping.asset_id == asset_id)
    )
    mappings = result.scalars().all()
    
    # Add signal details
    for mapping in mappings:
        signal_result = await db.execute(
            select(DCSignal).where(DCSignal.id == mapping.dcs_signal_id)
        )
        mapping.signal_details = signal_result.scalar_one_or_none()
    
    return mappings


@router.post("/mappings", response_model=AssetDCSMappingResponse)
async def create_asset_dcs_mapping(
    mapping: AssetDCSMappingCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Assign a DCS signal to an asset"""
    from app.models.dcs_models import AssetDCSMapping, DCSignal
    
    # Check if mapping already exists
    existing = await db.execute(
        select(AssetDCSMapping).where(
            and_(
                AssetDCSMapping.asset_id == mapping.asset_id,
                AssetDCSMapping.dcs_signal_id == mapping.dcs_signal_id
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Signal already mapped to this asset")
    
    # Create mapping
    new_mapping = AssetDCSMapping(
        asset_id=mapping.asset_id,
        dcs_signal_id=mapping.dcs_signal_id,
        display_name=mapping.display_name,
        unit=mapping.unit,
        min_alarm=mapping.min_alarm,
        max_alarm=mapping.max_alarm
    )
    db.add(new_mapping)
    
    # Mark signal as assigned
    await db.execute(
        select(DCSignal).where(DCSignal.id == mapping.dcs_signal_id)
    )
    # Update would go here
    
    await db.commit()
    await db.refresh(new_mapping)
    
    return new_mapping


@router.delete("/mappings/{mapping_id}")
async def delete_asset_dcs_mapping(
    mapping_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Remove DCS signal assignment from asset"""
    from app.models.dcs_models import AssetDCSMapping, DCSignal
    
    result = await db.execute(
        select(AssetDCSMapping).where(AssetDCSMapping.id == mapping_id)
    )
    mapping = result.scalar_one_or_none()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    # Unmark signal as assigned
    await db.execute(
        select(DCSignal).where(DCSignal.id == mapping.dcs_signal_id)
    )
    
    await db.delete(mapping)
    await db.commit()
    
    return {"message": "Mapping deleted successfully"}


@router.get("/data/{signal_id}")
async def get_signal_data(
    signal_id: int,
    hours: int = 24,
    db: AsyncSession = Depends(get_db)
):
    """Get recent DCS data for a signal"""
    from app.models.dcs_models import DCSData
    
    from datetime import datetime, timedelta
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    result = await db.execute(
        select(DCSData).where(
            and_(
                DCSData.dcs_signal_id == signal_id,
                DCSData.timestamp >= start_time
            )
        ).order_by(DCSData.timestamp)
    )
    data = result.scalars().all()
    
    return {
        "signal_id": signal_id,
        "data": [
            {"timestamp": d.timestamp.isoformat(), "value": d.value, "quality": d.quality}
            for d in data
        ]
    }

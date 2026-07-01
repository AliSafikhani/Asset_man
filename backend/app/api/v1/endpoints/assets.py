from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.assets import Assets
from app.models.hierarchy import Plants

router = APIRouter()

class AssetCreate(BaseModel):
    plant_id: int
    asset_type: str
    asset_name: str
    asset_code: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None

class AssetUpdate(BaseModel):
    plant_id: Optional[int] = None
    asset_type: Optional[str] = None
    asset_name: Optional[str] = None
    asset_code: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    operational_status: Optional[str] = None

class AssetResponse(AssetCreate):
    id: int
    operational_status: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/")
async def get_assets(
    plant_id: Optional[int] = None,
    asset_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Assets)
    if plant_id:
        query = query.where(Assets.plant_id == plant_id)
    if asset_type:
        query = query.where(Assets.asset_type == asset_type)
    result = await db.execute(query)
    assets = result.scalars().all()
    return {"items": assets, "total": len(assets)}

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset: AssetCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Verify plant exists
    plant_result = await db.execute(select(Plants).where(Plants.id == asset.plant_id))
    if not plant_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Check if asset code exists
    existing = await db.execute(select(Assets).where(Assets.asset_code == asset.asset_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Asset code already exists")
    
    new_asset = Assets(
        plant_id=asset.plant_id,
        asset_type=asset.asset_type,
        asset_name=asset.asset_name,
        asset_code=asset.asset_code,
        manufacturer=asset.manufacturer,
        model=asset.model,
        operational_status="active"
    )
    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)
    return new_asset

@router.get("/{asset_id}")
async def get_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Get existing asset
    result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Verify plant exists if plant_id is being updated
    if asset_data.plant_id is not None:
        plant_result = await db.execute(select(Plants).where(Plants.id == asset_data.plant_id))
        if not plant_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Plant not found")
    
    # Check if asset code exists (if being changed)
    if asset_data.asset_code is not None and asset_data.asset_code != asset.asset_code:
        existing = await db.execute(select(Assets).where(Assets.asset_code == asset_data.asset_code))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Asset code already exists")
    
    # Update only provided fields
    update_data = asset_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(asset, key, value)
    
    await db.commit()
    await db.refresh(asset)
    return asset

@router.delete("/{asset_id}")
async def delete_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    await db.delete(asset)
    await db.commit()
    return {"message": "Asset deleted successfully"}
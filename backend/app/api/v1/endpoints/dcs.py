from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.assets import Assets

router = APIRouter(prefix="/dcs-mappings", tags=["DCS Signal Mappings"])

# Pydantic models
class DCSMappingCreate(BaseModel):
    asset_id: int
    signal_name: str = Field(..., max_length=100)
    display_name: Optional[str] = Field(None, max_length=200)
    unit: Optional[str] = Field(None, max_length=50)
    table_name: str = Field(..., max_length=200)
    column_name: str = Field(..., max_length=200)
    data_type: str = "float"
    description: Optional[str] = None

class DCSMappingResponse(DCSMappingCreate):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

@router.get("/tables/{site_id}")
async def get_dcs_tables(site_id: int, user_id: int = Depends(get_current_user_id)):
    """Get all DCS table names available for a site"""
    # This would query DCS metadata from another database
    # For now, return sample data
    return {
        "tables": [
            {"name": "g12sy34", "description": "Generator 12 Data"},
            {"name": "tr_main", "description": "Transformer Main"},
            {"name": "motor_data", "description": "Motor Data"}
        ]
    }

@router.get("/columns/{table_name}")
async def get_table_columns(table_name: str, user_id: int = Depends(get_current_user_id)):
    """Get all column names for a specific DCS table"""
    # This would query DCS metadata from another database
    # For now, return sample data
    return {
        "columns": [
            {"name": "data1", "type": "float", "description": "Timestamp"},
            {"name": "data2", "type": "float", "description": "Power"},
            {"name": "data3", "type": "float", "description": "Voltage"},
            {"name": "data4", "type": "float", "description": "Current"},
            {"name": "data5", "type": "float", "description": "Frequency"},
            {"name": "data6", "type": "float", "description": "Temperature"},
            {"name": "data7", "type": "float", "description": "Vibration"},
            {"name": "data8", "type": "float", "description": "Pressure"},
            {"name": "data9", "type": "float", "description": "Speed"}
        ]
    }

@router.post("/", response_model=DCSMappingResponse, status_code=status.HTTP_201_CREATED)
async def create_dcs_mapping(
    mapping: DCSMappingCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new DCS signal mapping for an asset"""
    from app.models.dcs_mappings import DCSMapping
    
    # Verify asset exists
    asset_result = await db.execute(select(Assets).where(Assets.id == mapping.asset_id))
    if not asset_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check if signal already mapped for this asset
    existing = await db.execute(
        select(DCSMapping).where(
            DCSMapping.asset_id == mapping.asset_id,
            DCSMapping.signal_name == mapping.signal_name
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Signal already mapped for this asset")
    
    new_mapping = DCSMapping(**mapping.dict())
    db.add(new_mapping)
    await db.commit()
    await db.refresh(new_mapping)
    
    return new_mapping

@router.get("/asset/{asset_id}", response_model=List[DCSMappingResponse])
async def get_asset_mappings(
    asset_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all DCS mappings for an asset"""
    from app.models.dcs_mappings import DCSMapping
    
    result = await db.execute(
        select(DCSMapping).where(DCSMapping.asset_id == asset_id)
    )
    mappings = result.scalars().all()
    return mappings

@router.delete("/{mapping_id}")
async def delete_dcs_mapping(
    mapping_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a DCS signal mapping"""
    from app.models.dcs_mappings import DCSMapping
    
    result = await db.execute(select(DCSMapping).where(DCSMapping.id == mapping_id))
    mapping = result.scalar_one_or_none()
    
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    await db.delete(mapping)
    await db.commit()
    
    return {"message": "Mapping deleted successfully"}

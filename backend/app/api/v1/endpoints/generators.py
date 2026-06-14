from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.generators import Generators
from app.models.assets import Assets
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["Generators"])

class GeneratorCreate(BaseModel):
    asset_id: int
    generator_type: Optional[str] = None
    power_rating_mw: Optional[float] = None


@router.post("/")
async def create_generator(
    generator_data: GeneratorCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Assets).where(Assets.id == generator_data.asset_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    new_generator = Generators(
        asset_id=generator_data.asset_id,
        generator_type=generator_data.generator_type,
        power_rating_mw=generator_data.power_rating_mw
    )
    
    db.add(new_generator)
    await db.commit()
    await db.refresh(new_generator)
    
    return new_generator


@router.get("/{asset_id}")
async def get_generator(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Generators).where(Generators.asset_id == asset_id)
    )
    generator = result.scalar_one_or_none()
    
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    return generator

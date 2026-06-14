from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.models.tests import TestTypes

router = APIRouter()

class TestTypeResponse(BaseModel):
    id: int
    test_name: str
    asset_type: str
    test_category: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TestTypeResponse])
async def get_test_types(
    asset_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(TestTypes)
    if asset_type:
        query = query.where(TestTypes.asset_type == asset_type)
    result = await db.execute(query)
    test_types = result.scalars().all()
    return test_types

@router.get("/{test_type_id}", response_model=TestTypeResponse)
async def get_test_type(
    test_type_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(TestTypes).where(TestTypes.id == test_type_id))
    test_type = result.scalar_one_or_none()
    if not test_type:
        return None
    return test_type

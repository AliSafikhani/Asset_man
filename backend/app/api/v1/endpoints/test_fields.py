from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.models.test_field_definitions import TestFieldDefinition
from app.models.tests import TestTypes

router = APIRouter()

class TestFieldDefinitionResponse(BaseModel):
    id: int
    test_type_id: int
    field_name: str
    display_name: str
    unit: Optional[str]
    description: Optional[str]
    data_type: str
    is_required: bool
    min_value: Optional[float]
    max_value: Optional[float]
    allowed_values: Optional[List]
    display_order: int

    class Config:
        from_attributes = True


@router.get("/test-type/{test_type_id}", response_model=List[TestFieldDefinitionResponse])
async def get_test_field_definitions(
    test_type_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all field definitions for a test type"""
    
    # Verify test type exists
    test_type_result = await db.execute(select(TestTypes).where(TestTypes.id == test_type_id))
    if not test_type_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Test type not found")
    
    result = await db.execute(
        select(TestFieldDefinition)
        .where(TestFieldDefinition.test_type_id == test_type_id)
        .order_by(TestFieldDefinition.display_order)
    )
    fields = result.scalars().all()
    return fields

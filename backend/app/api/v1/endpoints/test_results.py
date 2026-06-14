from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.tests import TestTypes
from app.models.test_results import TestResult
from app.models.test_parameters import TestParameter
from app.models.assets import Assets

router = APIRouter()

# Pydantic models
class TestParameterCreate(BaseModel):
    field_name: str
    field_value: Optional[float] = None
    field_value_text: Optional[str] = None
    field_value_date: Optional[date] = None
    field_value_boolean: Optional[bool] = None
    unit: Optional[str] = None
    remarks: Optional[str] = None

class TestResultCreate(BaseModel):
    asset_id: int
    test_type_id: int
    test_date: date
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    parameters: List[TestParameterCreate] = []

class TestParameterResponse(BaseModel):
    id: int
    field_name: str
    field_value: Optional[float]
    field_value_text: Optional[str]
    field_value_date: Optional[date]
    field_value_boolean: Optional[bool]
    unit: Optional[str]
    remarks: Optional[str]

    class Config:
        from_attributes = True

class TestResultResponse(BaseModel):
    id: int
    asset_id: int
    test_type_id: int
    test_date: date
    lab_name: Optional[str]
    notes: Optional[str]
    created_at: datetime
    parameters: List[TestParameterResponse] = []

    class Config:
        from_attributes = True


@router.post("/", response_model=TestResultResponse, status_code=status.HTTP_201_CREATED)
async def create_test_result(
    result: TestResultCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new test result with parameters"""
    
    # Verify asset exists
    asset_result = await db.execute(select(Assets).where(Assets.id == result.asset_id))
    if not asset_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Verify test type exists
    test_type_result = await db.execute(select(TestTypes).where(TestTypes.id == result.test_type_id))
    if not test_type_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Test type not found")
    
    # Create test result header
    new_result = TestResult(
        asset_id=result.asset_id,
        test_type_id=result.test_type_id,
        test_date=result.test_date,
        lab_name=result.lab_name,
        notes=result.notes,
        created_by=user_id
    )
    db.add(new_result)
    await db.commit()
    await db.refresh(new_result)
    
    # Create test parameters
    for param in result.parameters:
        new_param = TestParameter(
            test_result_id=new_result.id,
            field_name=param.field_name,
            field_value=param.field_value,
            field_value_text=param.field_value_text,
            field_value_date=param.field_value_date,
            field_value_boolean=param.field_value_boolean,
            unit=param.unit,
            remarks=param.remarks
        )
        db.add(new_param)
    
    await db.commit()
    
    # Fetch with parameters
    return await get_test_result(new_result.id, db)


@router.get("/{result_id}", response_model=TestResultResponse)
async def get_test_result(
    result_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific test result with all parameters"""
    
    result = await db.execute(
        select(TestResult).where(TestResult.id == result_id)
    )
    test_result = result.scalar_one_or_none()
    if not test_result:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    # Get parameters
    params_result = await db.execute(
        select(TestParameter).where(TestParameter.test_result_id == result_id)
    )
    parameters = params_result.scalars().all()
    
    return TestResultResponse(
        id=test_result.id,
        asset_id=test_result.asset_id,
        test_type_id=test_result.test_type_id,
        test_date=test_result.test_date,
        lab_name=test_result.lab_name,
        notes=test_result.notes,
        created_at=test_result.created_at,
        parameters=[TestParameterResponse.model_validate(p) for p in parameters]
    )


@router.get("/asset/{asset_id}", response_model=List[TestResultResponse])
async def get_asset_test_results(
    asset_id: int,
    test_type_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all test results for an asset, optionally filtered by test type"""
    
    query = select(TestResult).where(TestResult.asset_id == asset_id)
    if test_type_id:
        query = query.where(TestResult.test_type_id == test_type_id)
    query = query.order_by(desc(TestResult.test_date))
    
    result = await db.execute(query)
    test_results = result.scalars().all()
    
    responses = []
    for tr in test_results:
        params_result = await db.execute(
            select(TestParameter).where(TestParameter.test_result_id == tr.id)
        )
        parameters = params_result.scalars().all()
        responses.append(TestResultResponse(
            id=tr.id,
            asset_id=tr.asset_id,
            test_type_id=tr.test_type_id,
            test_date=tr.test_date,
            lab_name=tr.lab_name,
            notes=tr.notes,
            created_at=tr.created_at,
            parameters=[TestParameterResponse.model_validate(p) for p in parameters]
        ))
    
    return responses

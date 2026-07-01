from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
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

class TestParameterUpdate(BaseModel):
    field_name: Optional[str] = None
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

class TestResultUpdate(BaseModel):
    test_date: Optional[date] = None
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    parameters: Optional[List[TestParameterCreate]] = None

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
    created_by: Optional[int]
    parameters: List[TestParameterResponse] = []

    class Config:
        from_attributes = True

class BatchDeleteResponse(BaseModel):
    message: str
    deleted_count: int


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
        created_by=test_result.created_by,
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
            created_by=tr.created_by,
            parameters=[TestParameterResponse.model_validate(p) for p in parameters]
        ))
    
    return responses


@router.get("/", response_model=List[TestResultResponse])
async def get_all_test_results(
    asset_id: Optional[int] = Query(None, description="Filter by asset ID"),
    test_type_id: Optional[int] = Query(None, description="Filter by test type ID"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    """Get all test results with optional filters and pagination"""
    
    query = select(TestResult)
    
    if asset_id:
        query = query.where(TestResult.asset_id == asset_id)
    if test_type_id:
        query = query.where(TestResult.test_type_id == test_type_id)
    
    query = query.order_by(desc(TestResult.test_date)).offset(skip).limit(limit)
    
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
            created_by=tr.created_by,
            parameters=[TestParameterResponse.model_validate(p) for p in parameters]
        ))
    
    return responses


@router.put("/{result_id}", response_model=TestResultResponse)
async def update_test_result(
    result_id: int,
    test_data: TestResultUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing test result"""
    
    # Find the test result
    result = await db.execute(
        select(TestResult).where(TestResult.id == result_id)
    )
    test_result = result.scalar_one_or_none()
    if not test_result:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    # Update basic info
    if test_data.test_date is not None:
        test_result.test_date = test_data.test_date
    if test_data.lab_name is not None:
        test_result.lab_name = test_data.lab_name
    if test_data.notes is not None:
        test_result.notes = test_data.notes
    
    # Update parameters if provided
    if test_data.parameters is not None:
        # Delete existing parameters
        await db.execute(
            delete(TestParameter).where(TestParameter.test_result_id == result_id)
        )
        
        # Create new parameters
        for param in test_data.parameters:
            new_param = TestParameter(
                test_result_id=result_id,
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
    await db.refresh(test_result)
    
    # Return updated result with parameters
    return await get_test_result(result_id, db)


@router.delete("/{result_id}", status_code=status.HTTP_200_OK)
async def delete_test_result(
    result_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a test result and its associated parameters"""
    
    # Find the test result
    result = await db.execute(
        select(TestResult).where(TestResult.id == result_id)
    )
    test_result = result.scalar_one_or_none()
    if not test_result:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    # Delete associated parameters first
    await db.execute(
        delete(TestParameter).where(TestParameter.test_result_id == result_id)
    )
    
    # Delete the test result
    await db.delete(test_result)
    await db.commit()
    
    return {
        "message": f"Test result {result_id} deleted successfully",
        "deleted_id": result_id
    }


@router.delete("/batch", response_model=BatchDeleteResponse, status_code=status.HTTP_200_OK)
async def batch_delete_test_results(
    ids: List[int],
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete multiple test results at once"""
    
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided for deletion")
    
    deleted_count = 0
    failed_ids = []
    
    for test_id in ids:
        # Find the test result
        result = await db.execute(
            select(TestResult).where(TestResult.id == test_id)
        )
        test_result = result.scalar_one_or_none()
        
        if test_result:
            # Delete associated parameters
            await db.execute(
                delete(TestParameter).where(TestParameter.test_result_id == test_id)
            )
            # Delete the test result
            await db.delete(test_result)
            deleted_count += 1
        else:
            failed_ids.append(test_id)
    
    await db.commit()
    
    return BatchDeleteResponse(
        message=f"Successfully deleted {deleted_count} test results" + 
                (f". Failed to find: {failed_ids}" if failed_ids else ""),
        deleted_count=deleted_count
    )


@router.delete("/asset/{asset_id}", status_code=status.HTTP_200_OK)
async def delete_all_test_results_for_asset(
    asset_id: int,
    test_type_id: Optional[int] = Query(None, description="Optional filter by test type"),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete all test results for a specific asset, optionally filtered by test type"""
    
    # Verify asset exists
    asset_result = await db.execute(select(Assets).where(Assets.id == asset_id))
    if not asset_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Build query to get test results to delete
    query = select(TestResult).where(TestResult.asset_id == asset_id)
    if test_type_id:
        query = query.where(TestResult.test_type_id == test_type_id)
    
    result = await db.execute(query)
    test_results = result.scalars().all()
    
    if not test_results:
        return {
            "message": f"No test results found for asset {asset_id}" + 
                      (f" with test type {test_type_id}" if test_type_id else ""),
            "deleted_count": 0
        }
    
    # Delete parameters and results
    for tr in test_results:
        await db.execute(
            delete(TestParameter).where(TestParameter.test_result_id == tr.id)
        )
        await db.delete(tr)
    
    await db.commit()
    
    return {
        "message": f"Successfully deleted {len(test_results)} test results for asset {asset_id}",
        "deleted_count": len(test_results)
    }
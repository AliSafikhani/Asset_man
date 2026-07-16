# backend\app\api\v1\endpoints\test_results.py
"""
Test Results API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, delete
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.test_results import TestResult
from app.models.test_parameters import TestParameter
from app.models.tests import TestTypes
from app.models.assets import Assets
from app.services.ieee_service import IEEEService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================
# PYDANTIC MODELS
# ============================================

class ParameterCreate(BaseModel):
    field_name: str
    field_value: Optional[float] = None
    field_value_text: Optional[str] = None
    field_value_date: Optional[str] = None
    field_value_boolean: Optional[bool] = None
    unit: Optional[str] = None


class TestResultCreate(BaseModel):
    asset_id: int
    test_type_id: int
    test_date: str
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    parameters: List[ParameterCreate]


class TestResultBatchItem(BaseModel):
    asset_id: int
    test_type_id: int
    test_date: str
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    parameters: List[ParameterCreate]


class BatchTestResultCreate(BaseModel):
    samples: List[TestResultBatchItem]


class TestResultUpdate(BaseModel):
    test_date: Optional[str] = None
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    parameters: Optional[List[ParameterCreate]] = None


class TestResultResponse(BaseModel):
    id: int
    asset_id: int
    test_type_id: int
    test_date: date
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    parameters: List[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# ENDPOINTS
# ============================================

@router.get("/")
async def get_test_results(
    asset_id: Optional[int] = Query(None, description="Filter by asset ID"),
    test_type_id: Optional[int] = Query(None, description="Filter by test type ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get test results with optional filters"""
    query = select(TestResult)
    
    if asset_id:
        query = query.where(TestResult.asset_id == asset_id)
    if test_type_id:
        query = query.where(TestResult.test_type_id == test_type_id)
    
    query = query.order_by(desc(TestResult.test_date))
    
    result = await db.execute(query)
    test_results = result.scalars().all()
    
    response_data = []
    for tr in test_results:
        params_result = await db.execute(
            select(TestParameter)
            .where(TestParameter.test_result_id == tr.id)
        )
        parameters = params_result.scalars().all()
        
        params = []
        for param in parameters:
            params.append({
                "field_name": param.field_name,
                "field_value": param.field_value,
                "field_value_text": param.field_value_text,
                "field_value_date": param.field_value_date,
                "field_value_boolean": param.field_value_boolean,
                "unit": param.unit
            })
        
        response_data.append({
            "id": tr.id,
            "asset_id": tr.asset_id,
            "test_type_id": tr.test_type_id,
            "test_date": tr.test_date,
            "lab_name": tr.lab_name,
            "notes": tr.notes,
            "parameters": params,
            "created_at": tr.created_at,
            "updated_at": tr.updated_at
        })
    
    return response_data


# ============================================
# POST /batch - BATCH INSERT (MUST BE BEFORE DELETE /batch)
# ============================================

@router.post("/batch", status_code=status.HTTP_201_CREATED)
async def batch_insert_test_results(
    test_data: BatchTestResultCreate,
    db: AsyncSession = Depends(get_db)
):
    """Insert multiple test results at once"""
    results = []
    errors = []
    
    for idx, sample in enumerate(test_data.samples):
        try:
            # Verify asset exists
            asset_result = await db.execute(
                select(Assets).where(Assets.id == sample.asset_id)
            )
            asset = asset_result.scalar_one_or_none()
            if not asset:
                errors.append({"row": idx + 1, "error": f"Asset {sample.asset_id} not found"})
                continue
            
            # Verify test type exists
            test_type_result = await db.execute(
                select(TestTypes).where(TestTypes.id == sample.test_type_id)
            )
            test_type = test_type_result.scalar_one_or_none()
            if not test_type:
                errors.append({"row": idx + 1, "error": f"Test type {sample.test_type_id} not found"})
                continue
            
            # Parse test date
            try:
                test_date = datetime.strptime(sample.test_date, "%Y-%m-%d").date()
            except ValueError:
                errors.append({"row": idx + 1, "error": f"Invalid date format: {sample.test_date}"})
                continue
            
            # Create test result
            test_result = TestResult(
                asset_id=sample.asset_id,
                test_type_id=sample.test_type_id,
                test_date=test_date,
                lab_name=sample.lab_name or "Default Lab",
                notes=sample.notes or ""
            )
            db.add(test_result)
            await db.flush()
            
            # Create parameters
            for param in sample.parameters:
                field_value_date = None
                if param.field_value_date:
                    try:
                        field_value_date = datetime.strptime(param.field_value_date, "%Y-%m-%d").date()
                    except ValueError:
                        pass
                
                test_parameter = TestParameter(
                    test_result_id=test_result.id,
                    field_name=param.field_name,
                    field_value=param.field_value,
                    field_value_text=param.field_value_text,
                    field_value_date=field_value_date,
                    field_value_boolean=param.field_value_boolean,
                    unit=param.unit
                )
                db.add(test_parameter)
            
            results.append({"row": idx + 1, "id": test_result.id, "success": True})
            
        except Exception as e:
            logger.error(f"Error on row {idx + 1}: {str(e)}")
            errors.append({"row": idx + 1, "error": str(e)})
            await db.rollback()
    
    if results:
        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "success": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_test_result(
    test_result: TestResultCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new test result"""
    
    asset_result = await db.execute(select(Assets).where(Assets.id == test_result.asset_id))
    asset = asset_result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    test_type_result = await db.execute(select(TestTypes).where(TestTypes.id == test_result.test_type_id))
    test_type = test_type_result.scalar_one_or_none()
    if not test_type:
        raise HTTPException(status_code=404, detail="Test type not found")
    
    try:
        test_date = datetime.strptime(test_result.test_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test date format. Use YYYY-MM-DD")
    
    new_test_result = TestResult(
        asset_id=test_result.asset_id,
        test_type_id=test_result.test_type_id,
        test_date=test_date,
        lab_name=test_result.lab_name,
        notes=test_result.notes,
        created_by=user_id
    )
    
    db.add(new_test_result)
    await db.flush()
    
    for param_data in test_result.parameters:
        field_value_date = None
        if param_data.field_value_date:
            try:
                field_value_date = datetime.strptime(param_data.field_value_date, "%Y-%m-%d").date()
            except ValueError:
                pass
        
        new_param = TestParameter(
            test_result_id=new_test_result.id,
            field_name=param_data.field_name,
            field_value=param_data.field_value,
            field_value_text=param_data.field_value_text,
            field_value_date=field_value_date,
            field_value_boolean=param_data.field_value_boolean,
            unit=param_data.unit
        )
        db.add(new_param)
    
    await db.commit()
    await db.refresh(new_test_result)
    
    response_params = []
    params_result = await db.execute(
        select(TestParameter)
        .where(TestParameter.test_result_id == new_test_result.id)
    )
    parameters = params_result.scalars().all()
    
    for param in parameters:
        response_params.append({
            "field_name": param.field_name,
            "field_value": param.field_value,
            "field_value_text": param.field_value_text,
            "field_value_date": param.field_value_date,
            "field_value_boolean": param.field_value_boolean,
            "unit": param.unit
        })
    
    return {
        "id": new_test_result.id,
        "asset_id": new_test_result.asset_id,
        "test_type_id": new_test_result.test_type_id,
        "test_date": new_test_result.test_date,
        "lab_name": new_test_result.lab_name,
        "notes": new_test_result.notes,
        "parameters": response_params,
        "created_at": new_test_result.created_at,
        "updated_at": new_test_result.updated_at
    }


@router.put("/{test_result_id}")
async def update_test_result(
    test_result_id: int,
    test_result: TestResultUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update a test result"""
    
    result = await db.execute(select(TestResult).where(TestResult.id == test_result_id))
    existing = result.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    if test_result.test_date is not None:
        try:
            existing.test_date = datetime.strptime(test_result.test_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid test date format. Use YYYY-MM-DD")
    
    if test_result.lab_name is not None:
        existing.lab_name = test_result.lab_name
    
    if test_result.notes is not None:
        existing.notes = test_result.notes
    
    if test_result.parameters is not None:
        params_result = await db.execute(
            select(TestParameter)
            .where(TestParameter.test_result_id == existing.id)
        )
        existing_params = params_result.scalars().all()
        for param in existing_params:
            await db.delete(param)
        
        for param_data in test_result.parameters:
            field_value_date = None
            if param_data.field_value_date:
                try:
                    field_value_date = datetime.strptime(param_data.field_value_date, "%Y-%m-%d").date()
                except ValueError:
                    pass
            
            new_param = TestParameter(
                test_result_id=existing.id,
                field_name=param_data.field_name,
                field_value=param_data.field_value,
                field_value_text=param_data.field_value_text,
                field_value_date=field_value_date,
                field_value_boolean=param_data.field_value_boolean,
                unit=param_data.unit
            )
            db.add(new_param)
    
    await db.commit()
    await db.refresh(existing)
    
    response_params = []
    params_result = await db.execute(
        select(TestParameter)
        .where(TestParameter.test_result_id == existing.id)
    )
    parameters = params_result.scalars().all()
    
    for param in parameters:
        response_params.append({
            "field_name": param.field_name,
            "field_value": param.field_value,
            "field_value_text": param.field_value_text,
            "field_value_date": param.field_value_date,
            "field_value_boolean": param.field_value_boolean,
            "unit": param.unit
        })
    
    return {
        "id": existing.id,
        "asset_id": existing.asset_id,
        "test_type_id": existing.test_type_id,
        "test_date": existing.test_date,
        "lab_name": existing.lab_name,
        "notes": existing.notes,
        "parameters": response_params,
        "created_at": existing.created_at,
        "updated_at": existing.updated_at
    }


@router.delete("/{test_result_id}")
async def delete_test_result(
    test_result_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a test result"""
    
    result = await db.execute(select(TestResult).where(TestResult.id == test_result_id))
    existing = result.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    params_result = await db.execute(
        select(TestParameter)
        .where(TestParameter.test_result_id == existing.id)
    )
    parameters = params_result.scalars().all()
    for param in parameters:
        await db.delete(param)
    
    await db.delete(existing)
    await db.commit()
    
    return {"message": "Test result deleted successfully"}


# ============================================
# DELETE /batch - BATCH DELETE (MUST BE AFTER POST /batch)
# ============================================

@router.delete("/batch")
async def delete_test_results_batch(
    ids: List[int],
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete multiple test results"""
    
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    
    result = await db.execute(select(TestResult).where(TestResult.id.in_(ids)))
    test_results = result.scalars().all()
    
    if not test_results:
        raise HTTPException(status_code=404, detail="No test results found")
    
    for tr in test_results:
        params_result = await db.execute(
            select(TestParameter)
            .where(TestParameter.test_result_id == tr.id)
        )
        parameters = params_result.scalars().all()
        for param in parameters:
            await db.delete(param)
        await db.delete(tr)
    
    await db.commit()
    
    return {"message": f"{len(test_results)} test result(s) deleted successfully"}
# backend/app/api/v1/endpoints/test_results.py

from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload  # ADD THIS
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, date
import traceback

from app.core.database import get_db
from app.models.test_results import TestResult
from app.models.test_parameters import TestParameter
from app.models.assets import Assets
from app.models.tests import TestTypes

router = APIRouter()


# ============================================
# PYDANTIC MODELS
# ============================================

class TestParameterCreate(BaseModel):
    field_name: str
    field_value: Optional[float] = None
    field_value_text: Optional[str] = None
    field_value_date: Optional[str] = None
    field_value_boolean: Optional[bool] = None
    unit: Optional[str] = None


class TestResultBatchItem(BaseModel):
    asset_id: int
    test_type_id: int
    test_date: str
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    parameters: List[TestParameterCreate]


class BatchTestResultCreate(BaseModel):
    samples: List[TestResultBatchItem]


class TestResultResponse(BaseModel):
    id: int
    asset_id: int
    test_type_id: int
    test_date: str
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    created_by: Optional[int] = None
    parameters: List[Dict[str, Any]] = []


class BatchDeleteRequest(BaseModel):
    data: List[int]


class BatchDeleteResponse(BaseModel):
    message: str


# ============================================
# POST /batch - BATCH INSERT
# ============================================

@router.post("/batch", status_code=status.HTTP_201_CREATED)
async def batch_insert_test_results(
    test_data: BatchTestResultCreate,
    db: AsyncSession = Depends(get_db)
):
    """Insert multiple test results at once."""
    
    results = []
    errors = []
    
    for idx, sample in enumerate(test_data.samples):
        try:
            # Check if asset exists
            asset_result = await db.execute(
                select(Assets).where(Assets.id == sample.asset_id)
            )
            asset = asset_result.scalar_one_or_none()
            if not asset:
                errors.append({"row": idx + 1, "error": "Asset not found"})
                continue
            
            # Check if test type exists
            test_type_result = await db.execute(
                select(TestTypes).where(TestTypes.id == sample.test_type_id)
            )
            test_type = test_type_result.scalar_one_or_none()
            if not test_type:
                errors.append({"row": idx + 1, "error": "Test type not found"})
                continue
            
            # Convert date string to date object
            test_date_obj = datetime.strptime(sample.test_date, "%Y-%m-%d").date()
            
            # Create test result
            test_result = TestResult(
                asset_id=sample.asset_id,
                test_type_id=sample.test_type_id,
                test_date=test_date_obj,
                lab_name=sample.lab_name,
                notes=sample.notes
            )
            db.add(test_result)
            await db.flush()
            
            # Create parameters
            for param in sample.parameters:
                test_parameter = TestParameter(
                    test_result_id=test_result.id,
                    field_name=param.field_name,
                    field_value=param.field_value,
                    field_value_text=param.field_value_text,
                    field_value_date=param.field_value_date,
                    field_value_boolean=param.field_value_boolean,
                    unit=param.unit
                )
                db.add(test_parameter)
            
            results.append({"row": idx + 1, "id": test_result.id, "success": True})
            
        except Exception as e:
            full_error = traceback.format_exc()
            print(f"❌ ERROR on row {idx + 1}:")
            print(full_error)
            errors.append({"row": idx + 1, "error": str(e)})
            await db.rollback()
    
    if results:
        try:
            await db.commit()
        except Exception as e:
            full_error = traceback.format_exc()
            print(f"❌ COMMIT ERROR: {full_error}")
            await db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
    
    return {"success": len(results), "failed": len(errors), "results": results, "errors": errors}


# ============================================
# GET / - GET ALL TEST RESULTS (FIXED)
# ============================================

@router.get("/")
async def get_test_results(
    asset_id: int = Query(...),
    test_type_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    # Get test results with parameters eagerly loaded
    result = await db.execute(
        select(TestResult)
        .where(
            TestResult.asset_id == asset_id,
            TestResult.test_type_id == test_type_id
        )
        .order_by(TestResult.test_date.desc())
        .options(selectinload(TestResult.parameters))  # FIX: Eagerly load parameters
    )
    test_results = result.scalars().all()
    
    return test_results


@router.get("/{result_id}")
async def get_test_result(
    result_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TestResult)
        .where(TestResult.id == result_id)
        .options(selectinload(TestResult.parameters))  # FIX: Eagerly load parameters
    )
    test_result = result.scalar_one_or_none()
    if not test_result:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    return test_result


# ============================================
# POST / - SINGLE INSERT
# ============================================

@router.post("/", response_model=TestResultResponse, status_code=status.HTTP_201_CREATED)
async def create_test_result(
    test_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """Create a single test result"""
    try:
        test_date_obj = datetime.strptime(test_data.get("test_date"), "%Y-%m-%d").date()
        
        test_result = TestResult(
            asset_id=test_data.get("asset_id"),
            test_type_id=test_data.get("test_type_id"),
            test_date=test_date_obj,
            lab_name=test_data.get("lab_name"),
            notes=test_data.get("notes")
        )
        db.add(test_result)
        await db.flush()
        
        for param in test_data.get("parameters", []):
            test_parameter = TestParameter(
                test_result_id=test_result.id,
                field_name=param.get("field_name"),
                field_value=param.get("field_value"),
                field_value_text=param.get("field_value_text"),
                field_value_date=param.get("field_value_date"),
                field_value_boolean=param.get("field_value_boolean"),
                unit=param.get("unit")
            )
            db.add(test_parameter)
        
        await db.commit()
        
        return TestResultResponse(
            id=test_result.id,
            asset_id=test_result.asset_id,
            test_type_id=test_result.test_type_id,
            test_date=test_result.test_date.strftime("%Y-%m-%d"),
            lab_name=test_result.lab_name,
            notes=test_result.notes,
            created_at=test_result.created_at,
            created_by=test_result.created_by,
            parameters=test_data.get("parameters", [])
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# PUT - UPDATE
# ============================================

@router.put("/{result_id}")
async def update_test_result(
    result_id: int,
    test_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(TestResult)
            .where(TestResult.id == result_id)
            .options(selectinload(TestResult.parameters))
        )
        test_result = result.scalar_one_or_none()
        if not test_result:
            raise HTTPException(status_code=404, detail="Test result not found")
        
        if "test_date" in test_data:
            test_result.test_date = datetime.strptime(test_data["test_date"], "%Y-%m-%d").date()
        if "lab_name" in test_data:
            test_result.lab_name = test_data["lab_name"]
        if "notes" in test_data:
            test_result.notes = test_data["notes"]
        
        # Delete existing parameters
        await db.execute(
            delete(TestParameter).where(TestParameter.test_result_id == result_id)
        )
        
        # Create new parameters
        for param in test_data.get("parameters", []):
            test_parameter = TestParameter(
                test_result_id=test_result.id,
                field_name=param.get("field_name"),
                field_value=param.get("field_value"),
                field_value_text=param.get("field_value_text"),
                field_value_date=param.get("field_value_date"),
                field_value_boolean=param.get("field_value_boolean"),
                unit=param.get("unit")
            )
            db.add(test_parameter)
        
        await db.commit()
        return {"id": test_result.id, "message": "Test result updated successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# DELETE ENDPOINTS
# ============================================

@router.delete("/{result_id}")
async def delete_test_result(
    result_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(TestResult).where(TestResult.id == result_id)
        )
        test_result = result.scalar_one_or_none()
        if not test_result:
            raise HTTPException(status_code=404, detail="Test result not found")
        
        await db.execute(
            delete(TestParameter).where(TestParameter.test_result_id == result_id)
        )
        await db.delete(test_result)
        await db.commit()
        
        return {"message": "Test result deleted successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/batch", response_model=BatchDeleteResponse, status_code=status.HTTP_200_OK)
async def batch_delete_test_results(
    request: BatchDeleteRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        result_ids = request.data
        if not result_ids:
            raise HTTPException(status_code=400, detail="No IDs provided")
        
        await db.execute(
            delete(TestParameter).where(
                TestParameter.test_result_id.in_(result_ids)
            )
        )
        
        deleted_count_result = await db.execute(
            delete(TestResult).where(
                TestResult.id.in_(result_ids)
            )
        )
        deleted_count = deleted_count_result.rowcount
        
        await db.commit()
        
        return BatchDeleteResponse(message=f"Deleted {deleted_count} test results")
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
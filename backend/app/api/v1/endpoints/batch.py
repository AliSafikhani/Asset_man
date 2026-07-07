# backend/app/api/v1/endpoints/batch.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

# FIX: Use the correct import path
from app.db.database import get_db  # Try this first
# OR
# from app.database import get_db  # If this doesn't work, try the above

from app.models import TestResult, TestParameter, Asset, TestType

router = APIRouter()


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


@router.post("/batch")
async def batch_insert_test_results(
    test_data: BatchTestResultCreate,
    db: Session = Depends(get_db)
):
    """
    Insert multiple test results at once
    """
    results = []
    errors = []
    
    for idx, sample in enumerate(test_data.samples):
        try:
            asset = db.query(Asset).filter(Asset.id == sample.asset_id).first()
            if not asset:
                errors.append({
                    "row": idx + 1,
                    "error": f"Asset with ID {sample.asset_id} not found"
                })
                continue
            
            test_type = db.query(TestType).filter(TestType.id == sample.test_type_id).first()
            if not test_type:
                errors.append({
                    "row": idx + 1,
                    "error": f"Test type with ID {sample.test_type_id} not found"
                })
                continue
            
            test_result = TestResult(
                asset_id=sample.asset_id,
                test_type_id=sample.test_type_id,
                test_date=sample.test_date,
                lab_name=sample.lab_name,
                notes=sample.notes
            )
            db.add(test_result)
            db.flush()
            
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
            
            results.append({
                "row": idx + 1,
                "id": test_result.id,
                "success": True
            })
            
        except Exception as e:
            errors.append({
                "row": idx + 1,
                "error": str(e)
            })
            db.rollback()
    
    if results:
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "success": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }
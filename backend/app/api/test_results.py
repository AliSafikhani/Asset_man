# Add this to your existing backend/app/api/test_results.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import TestResult, TestParameter, Asset, TestType

router = APIRouter()

# --- Request/Response Models ---
class TestParameterCreate(BaseModel):
    field_name: str
    field_value: float = None
    field_value_text: str = None
    field_value_date: str = None
    field_value_boolean: bool = None
    unit: str = None

class TestResultBatchItem(BaseModel):
    asset_id: int
    test_type_id: int
    test_date: str
    lab_name: str = None
    notes: str = None
    parameters: List[TestParameterCreate]

class BatchTestResultCreate(BaseModel):
    samples: List[TestResultBatchItem]

class BatchResultResponse(BaseModel):
    success: int
    failed: int
    results: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]


@router.post("/batch", response_model=BatchResultResponse)
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
            # Validate asset exists
            asset = db.query(Asset).filter(Asset.id == sample.asset_id).first()
            if not asset:
                errors.append({
                    "row": idx + 1,
                    "error": f"Asset with ID {sample.asset_id} not found"
                })
                continue
            
            # Validate test type exists
            test_type = db.query(TestType).filter(TestType.id == sample.test_type_id).first()
            if not test_type:
                errors.append({
                    "row": idx + 1,
                    "error": f"Test type with ID {sample.test_type_id} not found"
                })
                continue
            
            # Create test result
            test_result = TestResult(
                asset_id=sample.asset_id,
                test_type_id=sample.test_type_id,
                test_date=sample.test_date,
                lab_name=sample.lab_name,
                notes=sample.notes
            )
            db.add(test_result)
            db.flush()  # Get the ID without committing
            
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
            
            results.append({
                "row": idx + 1,
                "id": test_result.id,
                "success": True
            })
            
        except Exception as e:
            db.rollback()
            errors.append({
                "row": idx + 1,
                "error": str(e)
            })
    
    # Commit all successful inserts
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
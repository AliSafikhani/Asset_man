from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from app.schemas import TestStatusEnum

# Test Types Schemas
class TestTypeBase(BaseModel):
    test_name: str = Field(..., min_length=1, max_length=100)
    asset_type: str = Field(..., pattern="^(generator|transformer|motor)$")
    test_category: Optional[str] = None
    description: Optional[str] = None
    parameters_schema: Optional[Dict[str, Any]] = None

class TestTypeCreate(TestTypeBase):
    pass

class TestTypeResponse(TestTypeBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Test Results Schemas
class TestResultDetailBase(BaseModel):
    parameter_name: str
    parameter_value: Optional[float] = None
    parameter_unit: Optional[str] = None
    limit_min: Optional[float] = None
    limit_max: Optional[float] = None
    is_pass: Optional[bool] = None
    remarks: Optional[str] = None

class TestResultDetailCreate(TestResultDetailBase):
    pass

class TestResultDetailResponse(TestResultDetailBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TestResultHeaderBase(BaseModel):
    asset_id: int
    test_type_id: int
    test_date: date
    test_performed_by: Optional[int] = None
    report_number: Optional[str] = None
    equipment_used: Optional[str] = None
    weather_conditions: Optional[str] = None
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = Field(None, ge=0, le=100)
    remarks: Optional[str] = None

class TestResultCreate(TestResultHeaderBase):
    test_details: List[TestResultDetailCreate] = []

class TestResultUpdate(BaseModel):
    status: Optional[TestStatusEnum] = None
    test_approved_by: Optional[int] = None
    remarks: Optional[str] = None

class TestResultResponse(TestResultHeaderBase):
    id: int
    status: TestStatusEnum
    test_performed_by_user: Optional[str] = None
    test_approved_by_user: Optional[str] = None
    test_details: List[TestResultDetailResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True

# Test Summary
class TestSummaryResponse(BaseModel):
    test_name: str
    asset_name: str
    test_date: date
    status: str
    parameter_count: int
    failed_parameters: int

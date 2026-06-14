"""
Pydantic schemas for Test Dataset validation and serialization
Fixed for Pydantic V2 - 'regex' changed to 'pattern'
"""

from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class DatasetStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class ParameterType(str, Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"
    FILE = "file"


class ParameterDefinition(BaseModel):
    """Definition for a single parameter"""
    name: str
    type: ParameterType
    required: bool = True
    default: Optional[Any] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    allowed_values: Optional[List[Any]] = None
    description: Optional[str] = None


class TestDatasetBase(BaseModel):
    """Base schema for test dataset"""
    name: str = Field(..., min_length=1, max_length=255)
    version: str = Field("1.0.0", pattern=r"^\d+\.\d+\.\d+$")  # Fixed: regex -> pattern
    description: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    parameter_schema: Optional[Dict[str, Any]] = None
    extra_metadata: Dict[str, Any] = Field(default_factory=dict)  # Renamed from metadata
    tags: List[str] = Field(default_factory=list)
    
    @validator('parameters')
    def validate_parameters(cls, v):
        """Ensure parameters dictionary is not too large"""
        if len(v) > 1000:
            raise ValueError('Too many parameters (max 1000)')
        return v
    
    @validator('tags')
    def validate_tags(cls, v):
        """Validate tags"""
        if len(v) > 50:
            raise ValueError('Too many tags (max 50)')
        return v


class TestDatasetCreate(TestDatasetBase):
    """Schema for creating a test dataset"""
    pass


class TestDatasetUpdate(BaseModel):
    """Schema for updating a test dataset"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    version: Optional[str] = Field(None, pattern=r"^\d+\.\d+\.\d+$")  # Fixed: regex -> pattern
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    parameter_schema: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    status: Optional[DatasetStatus] = None
    is_archived: Optional[bool] = None


class TestDatasetResponse(TestDatasetBase):
    """Schema for test dataset response"""
    id: int
    status: DatasetStatus
    processing_progress: float
    data_points_count: int
    file_size_bytes: int
    quality_score: Optional[float]
    validation_errors: List[Any] = []
    created_by: int
    updated_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    processed_at: Optional[datetime]
    is_archived: bool
    
    class Config:
        from_attributes = True


class TestDatasetListResponse(BaseModel):
    """Paginated response for test datasets"""
    items: List[TestDatasetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


# Dataset Run Schemas
class DatasetRunBase(BaseModel):
    """Base schema for dataset run"""
    run_name: Optional[str] = None
    results: Dict[str, Any] = Field(default_factory=dict)
    output_files: List[str] = Field(default_factory=list)


class DatasetRunCreate(DatasetRunBase):
    """Schema for creating a dataset run"""
    dataset_id: int


class DatasetRunUpdate(BaseModel):
    """Schema for updating a dataset run"""
    status: Optional[DatasetStatus] = None
    results: Optional[Dict[str, Any]] = None
    execution_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    cpu_usage_percent: Optional[float] = None
    memory_usage_mb: Optional[float] = None


class DatasetRunResponse(DatasetRunBase):
    """Schema for dataset run response"""
    id: int
    dataset_id: int
    run_number: int
    executed_by: int
    executed_at: datetime
    execution_time_ms: Optional[int]
    status: DatasetStatus
    error_message: Optional[str]
    cpu_usage_percent: Optional[float]
    memory_usage_mb: Optional[float]
    
    class Config:
        from_attributes = True


# Parameter Template Schemas
class ParameterTemplateBase(BaseModel):
    """Base schema for parameter template"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    parameter_schema: Dict[str, Any] = Field(default_factory=dict)
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ParameterTemplateCreate(ParameterTemplateBase):
    """Schema for creating a parameter template"""
    pass


class ParameterTemplateUpdate(BaseModel):
    """Schema for updating a parameter template"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    parameter_schema: Optional[Dict[str, Any]] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class ParameterTemplateResponse(ParameterTemplateBase):
    """Schema for parameter template response"""
    id: int
    usage_count: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Batch Operations Schemas
class BatchDatasetUpload(BaseModel):
    """Schema for batch uploading multiple datasets"""
    datasets: List[TestDatasetCreate]
    validate_only: bool = False


class BatchUploadResult(BaseModel):
    """Schema for batch upload result"""
    total: int
    successful: int
    failed: int
    errors: List[Dict[str, Any]] = []
    dataset_ids: List[int] = []


# Dataset Filter Schema
class DatasetFilter(BaseModel):
    """Schema for filtering datasets"""
    search: Optional[str] = None
    status: Optional[DatasetStatus] = None
    tags: Optional[List[str]] = None
    created_by: Optional[int] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    is_archived: bool = False
    min_quality_score: Optional[float] = Field(None, ge=0, le=100)
    parameter_filters: Optional[Dict[str, Any]] = None

# Add this after BatchUploadResult class and before ValidationResult class

class DatasetComparisonResponse(BaseModel):
    """Schema for dataset comparison response"""
    id: int
    name: str
    description: Optional[str]
    run_ids: List[int]
    comparison_data: Dict[str, Any] = {}
    summary: Dict[str, Any] = {}
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True
# Validation Results Schema
class ValidationResult(BaseModel):
    """Schema for dataset validation results"""
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    parameter_count: int
    missing_parameters: List[str] = []
    invalid_parameters: List[str] = []

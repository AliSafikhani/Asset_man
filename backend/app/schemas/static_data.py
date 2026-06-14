"""
Pydantic schemas for static data validation and serialization
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DataType(str, Enum):
    """Data type enumeration"""
    TEXT = "text"
    NUMBER = "number"
    BOOLEAN = "boolean"
    JSON = "json"
    DATE = "date"


class StaticDataBase(BaseModel):
    """Base static data schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    data_type: DataType = DataType.TEXT
    value: Any
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_public: bool = True
    priority: int = Field(0, ge=0, le=100)


class StaticDataCreate(StaticDataBase):
    """Schema for creating static data"""
    pass


class StaticDataUpdate(BaseModel):
    """Schema for updating static data"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    data_type: Optional[DataType] = None
    value: Optional[Any] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0, le=100)


class StaticDataResponse(StaticDataBase):
    """Schema for static data response"""
    id: int
    view_count: int
    created_by: int
    updated_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    is_deleted: bool
    
    class Config:
        from_attributes = True


class StaticDataListResponse(BaseModel):
    """Schema for paginated static data response"""
    items: List[StaticDataResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


class StaticDataFilter(BaseModel):
    """Schema for filtering static data"""
    search: Optional[str] = None
    category: Optional[str] = None
    data_type: Optional[DataType] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    min_priority: Optional[int] = Field(None, ge=0)
    max_priority: Optional[int] = Field(None, le=100)


class BulkUploadResponse(BaseModel):
    """Schema for bulk upload response"""
    total: int
    success: int
    failed: int
    failed_records: List[Dict[str, Any]]
    message: str

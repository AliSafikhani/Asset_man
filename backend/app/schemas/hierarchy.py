from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from app.schemas import ResponseModel

# Centroids Schemas
class CentroidsBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    abbreviation: Optional[str] = Field(None, max_length=20)
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = "UTC"
    status: Optional[str] = "active"
    metadata: Optional[Dict[str, Any]] = {}

class CentroidsCreate(CentroidsBase):
    pass

class CentroidsUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None

class CentroidsResponse(CentroidsBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Companies Schemas
class CompaniesBase(BaseModel):
    centroid_id: int
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    abbreviation: Optional[str] = None
    company_type: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = "active"
    metadata: Optional[Dict[str, Any]] = {}

class CompaniesCreate(CompaniesBase):
    pass

class CompaniesResponse(CompaniesBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Plants Schemas
class PlantsBase(BaseModel):
    company_id: int
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    plant_type: Optional[str] = None
    plant_manager_name: Optional[str] = None
    plant_manager_email: Optional[EmailStr] = None
    plant_manager_phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    commissioning_date: Optional[datetime] = None
    operational_status: Optional[str] = "operational"
    installed_capacity_mw: Optional[float] = None

class PlantsCreate(PlantsBase):
    pass

class PlantsResponse(PlantsBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# Enums
class AssetTypeEnum(str, Enum):
    GENERATOR = "generator"
    TRANSFORMER = "transformer"
    MOTOR = "motor"

class OperationalStatusEnum(str, Enum):
    ACTIVE = "active"
    STANDBY = "standby"
    MAINTENANCE = "maintenance"
    FAILED = "failed"
    DECOMMISSIONED = "decommissioned"

class TestStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVIEW = "review"

class AlarmSeverityEnum(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ENGINEER = "engineer"
    TECHNICIAN = "technician"
    VIEWER = "viewer"

class LevelTypeEnum(str, Enum):
    CENTROID = "centroid"
    COMPANY = "company"
    PLANT = "plant"

# Base Response
class ResponseModel(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

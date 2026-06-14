from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas import AlarmSeverityEnum

# Signal Definition Schemas
class SignalDefinitionBase(BaseModel):
    asset_type: str = Field(..., pattern="^(generator|transformer|motor)$")
    parameter_name: str = Field(..., min_length=1, max_length=100)
    display_name: Optional[str] = None
    unit: Optional[str] = None
    min_normal: Optional[float] = None
    max_normal: Optional[float] = None
    critical_min: Optional[float] = None
    critical_max: Optional[float] = None
    is_critical: bool = False

class SignalDefinitionResponse(SignalDefinitionBase):
    id: int
    display_order: Optional[int]
    is_active: bool
    
    class Config:
        from_attributes = True

# Real-time Data Schemas
class RealtimeDataPoint(BaseModel):
    time: datetime
    asset_id: int
    parameter_name: str
    parameter_value: float
    parameter_unit: Optional[str] = None
    quality_score: float = 1.0

class RealtimeDataBatch(BaseModel):
    asset_id: int
    data_points: List[RealtimeDataPoint]

class RealtimeDataResponse(BaseModel):
    time: datetime
    asset_name: str
    parameter_name: str
    parameter_value: float
    parameter_unit: Optional[str]
    is_alarm: bool
    
    class Config:
        from_attributes = True

# Alarm Rule Schemas
class AlarmRuleBase(BaseModel):
    asset_id: Optional[int] = None
    asset_type: Optional[str] = None
    parameter_name: str
    alarm_type: str = Field(..., pattern="^(high|low|range|rate)$")
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    severity: AlarmSeverityEnum
    message: Optional[str] = None

class AlarmRuleCreate(AlarmRuleBase):
    pass

class AlarmRuleResponse(AlarmRuleBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Alarm Log Schemas
class AlarmLogResponse(BaseModel):
    id: int
    asset_name: str
    parameter_name: str
    actual_value: float
    severity: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime]
    acknowledged_by: Optional[str]
    resolved_at: Optional[datetime]
    status: str
    
    class Config:
        from_attributes = True

# Real-time Dashboard
class AssetRealtimeStatus(BaseModel):
    asset_id: int
    asset_name: str
    asset_type: str
    status: str
    current_values: Dict[str, float]
    active_alarms: int
    last_update: datetime

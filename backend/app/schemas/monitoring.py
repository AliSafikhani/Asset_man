"""
Monitoring Schemas
File: app/schemas/monitoring.py
Description: Pydantic models for live monitoring API
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


# ============================================================
# SIGNAL GROUP SCHEMAS
# ============================================================

class SignalGroupBase(BaseModel):
    group_name: str = Field(..., max_length=50, description="Group name (e.g., Voltage, Current)")
    description: Optional[str] = Field(None, description="Group description")
    color_hex: str = Field("#808080", description="Group color in hex format")
    icon: Optional[str] = Field(None, max_length=50, description="Icon name")
    sort_order: int = Field(0, description="Display order")

    @validator('color_hex')
    def validate_color_hex(cls, v):
        if not v.startswith('#'):
            return f"#{v}"
        return v


class SignalGroupCreate(SignalGroupBase):
    plant_id: int


class SignalGroupUpdate(SignalGroupBase):
    group_name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    color_hex: Optional[str] = None
    sort_order: Optional[int] = None


class SignalGroupResponse(SignalGroupBase):
    id: int
    plant_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================
# SIGNAL CONFIGURATION SCHEMAS
# ============================================================

class SignalConfigurationBase(BaseModel):
    signal_id: int = Field(..., description="Reference to DCS engine signal ID")
    plant_id: int
    
    # Assignment
    asset_id: Optional[int] = None
    group_id: Optional[int] = None
    
    # Display settings
    custom_name: Optional[str] = Field(None, max_length=100)
    custom_unit: Optional[str] = Field(None, max_length=20)
    color_hex: str = Field("#2196F3")
    line_type: str = Field("solid", description="solid, dashed, dotted, dashdot")
    line_width: int = Field(2, ge=1, le=10)
    scale_factor: float = Field(1.0, ge=0.1, le=100.0)
    y_axis_side: str = Field("left", description="left or right")
    
    # Alarm settings
    alert_threshold_min: Optional[float] = None
    alert_threshold_max: Optional[float] = None
    is_threshold_enabled: bool = False
    
    # Visibility
    is_visible: bool = True
    is_active: bool = True


class SignalConfigurationCreate(SignalConfigurationBase):
    assigned_by: Optional[int] = None


class SignalConfigurationUpdate(BaseModel):
    asset_id: Optional[int] = None
    group_id: Optional[int] = None
    custom_name: Optional[str] = Field(None, max_length=100)
    custom_unit: Optional[str] = Field(None, max_length=20)
    color_hex: Optional[str] = None
    line_type: Optional[str] = None
    line_width: Optional[int] = Field(None, ge=1, le=10)
    scale_factor: Optional[float] = Field(None, ge=0.1, le=100.0)
    y_axis_side: Optional[str] = None
    alert_threshold_min: Optional[float] = None
    alert_threshold_max: Optional[float] = None
    is_threshold_enabled: Optional[bool] = None
    is_visible: Optional[bool] = None
    is_active: Optional[bool] = None

    @validator('color_hex')
    def validate_color_hex(cls, v):
        if v and not v.startswith('#'):
            return f"#{v}"
        return v


class SignalConfigurationResponse(SignalConfigurationBase):
    id: int
    assigned_at: datetime
    assigned_by: Optional[int]
    updated_at: Optional[datetime]
    
    # Nested data
    signal_details: Optional[Dict[str, Any]] = None
    asset_name: Optional[str] = None
    group_name: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# SIGNAL DATA SCHEMAS
# ============================================================

class SignalDataPoint(BaseModel):
    timestamp: str
    value: Optional[float] = None
    quality: Optional[bool] = True
    rms: Optional[float] = None
    rate_of_change: Optional[float] = None


class SignalMinuteDataPoint(BaseModel):
    timestamp: str
    avg_value: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    count: int = 0
    rms_avg: Optional[float] = None


class SignalHourDataPoint(BaseModel):
    timestamp: str
    avg_value: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    count: int = 0
    rms_avg: Optional[float] = None


class SignalDataResponse(BaseModel):
    signal_id: int
    time_level: str  # raw, minute, hour
    start_time: str
    end_time: str
    data_points: List[Any]
    total_points: int


# ============================================================
# DATA AVAILABILITY TIMELINE SCHEMAS
# ============================================================

class TimelinePoint(BaseModel):
    timestamp: str
    data_count: int
    quality_ratio: Optional[float] = None
    avg_value: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None


class TimelineResponse(BaseModel):
    signal_id: int
    time_level: str  # raw, minute, hour
    intervals: List[TimelinePoint]
    total_intervals: int


# ============================================================
# COMPARISON SCHEMAS
# ============================================================

class ComparisonGroupBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    group_type: Optional[str] = Field(None, max_length=50, description="voltage, current, temperature, vibration")
    created_by: Optional[int] = None


class ComparisonGroupCreate(ComparisonGroupBase):
    plant_id: int


class ComparisonGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    group_type: Optional[str] = None


class ComparisonGroupItemCreate(BaseModel):
    signal_config_id: int


class ComparisonGroupResponse(ComparisonGroupBase):
    id: int
    plant_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    items: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True


# ============================================================
# ALARM SCHEMAS
# ============================================================

class AlarmBase(BaseModel):
    signal_config_id: int
    alarm_type: str = Field(..., description="MIN, MAX, RATE")
    triggered_value: float
    threshold_value: float
    severity: str = Field("warning", description="info, warning, critical")
    notes: Optional[str] = None


class AlarmCreate(AlarmBase):
    asset_id: Optional[int] = None


class AlarmUpdate(BaseModel):
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[int] = None
    cleared_at: Optional[datetime] = None
    is_cleared: bool = False
    notes: Optional[str] = None


class AlarmResponse(AlarmBase):
    id: int
    asset_id: Optional[int]
    triggered_at: datetime
    acknowledged_at: Optional[datetime]
    acknowledged_by: Optional[int]
    cleared_at: Optional[datetime]
    is_cleared: bool
    
    # Nested data
    signal_name: Optional[str] = None
    asset_name: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# LATEST VALUE SCHEMAS
# ============================================================

class LatestValueResponse(BaseModel):
    signal_id: int
    timestamp: str
    value: float
    quality: bool
    rms: Optional[float] = None
    rate_of_change: Optional[float] = None
    signal_name: Optional[str] = None
    unit: Optional[str] = None
    color_hex: Optional[str] = None
    status: str = "normal"  # normal, warning, critical


# ============================================================
# PLANT SIGNALS RESPONSE
# ============================================================

class PlantSignalResponse(BaseModel):
    signal_id: int
    plant_id: int
    kks_code: str
    name: str
    description: Optional[str] = None
    unit: Optional[str] = None
    
    # Configuration (if exists)
    config_id: Optional[int] = None
    asset_id: Optional[int] = None
    asset_name: Optional[str] = None
    group_id: Optional[int] = None
    group_name: Optional[str] = None
    custom_name: Optional[str] = None
    custom_unit: Optional[str] = None
    color_hex: Optional[str] = None
    is_visible: bool = True
    is_assigned: bool = False
    
    # Latest value
    latest_value: Optional[float] = None
    latest_timestamp: Optional[str] = None
    latest_quality: Optional[bool] = None
    
    # Alarm status
    alarm_status: str = "normal"  # normal, warning, critical
    alarm_value: Optional[float] = None


class PlantSignalsResponse(BaseModel):
    plant_id: int
    total_signals: int
    assigned_signals: int
    signals: List[PlantSignalResponse]
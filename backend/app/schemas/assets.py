from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.schemas import AssetTypeEnum, OperationalStatusEnum

# Base Asset Schema
class AssetBase(BaseModel):
    plant_id: int
    asset_type: AssetTypeEnum
    asset_name: str = Field(..., min_length=1, max_length=200)
    asset_code: str = Field(..., min_length=1, max_length=100)
    asset_tag: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturing_year: Optional[int] = Field(None, ge=1900, le=datetime.now().year)
    installation_date: Optional[datetime] = None
    commissioning_date: Optional[datetime] = None
    operational_status: Optional[OperationalStatusEnum] = OperationalStatusEnum.ACTIVE
    criticality_level: Optional[str] = Field(None, pattern="^(critical|high|medium|low)$")
    location_within_plant: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    asset_name: Optional[str] = None
    operational_status: Optional[OperationalStatusEnum] = None
    criticality_level: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class AssetResponse(AssetBase):
    id: int
    asset_health_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Generator Schemas
class GeneratorBase(BaseModel):
    asset_id: int
    generator_type: Optional[str] = None
    prime_mover_type: Optional[str] = None
    fuel_type: Optional[str] = None
    power_rating_mw: Optional[float] = None
    power_rating_mva: Optional[float] = None
    power_factor: Optional[float] = None
    efficiency_percent: Optional[float] = None
    voltage_kv: Optional[float] = None
    current_a: Optional[float] = None
    frequency_hz: Optional[float] = 50.0
    cooling_method: Optional[str] = None
    insulation_class: Optional[str] = None
    rotor_speed_rpm: Optional[int] = None
    weight_kg: Optional[float] = None

class GeneratorCreate(GeneratorBase):
    pass

class GeneratorResponse(GeneratorBase):
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Transformer Schemas
class TransformerBase(BaseModel):
    asset_id: int
    transformer_type: Optional[str] = None
    cooling_type: Optional[str] = None
    power_rating_mva: Optional[float] = None
    hv_voltage_kv: Optional[float] = None
    lv_voltage_kv: Optional[float] = None
    impedance_percent: Optional[float] = None
    vector_group: Optional[str] = None
    insulation_type: Optional[str] = None
    oil_volume_liters: Optional[float] = None
    weight_kg: Optional[float] = None
    no_load_loss_w: Optional[float] = None
    load_loss_w: Optional[float] = None

class TransformerCreate(TransformerBase):
    pass

class TransformerResponse(TransformerBase):
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Motor Schemas
class MotorBase(BaseModel):
    asset_id: int
    motor_type: Optional[str] = None
    frame_size: Optional[str] = None
    power_hp: Optional[float] = None
    power_kw: Optional[float] = None
    voltage_v: Optional[float] = None
    current_a: Optional[float] = None
    frequency_hz: Optional[float] = 50.0
    synchronous_speed_rpm: Optional[int] = None
    efficiency_class: Optional[str] = None
    insulation_class: Optional[str] = None
    weight_kg: Optional[float] = None

class MotorCreate(MotorBase):
    pass

class MotorResponse(MotorBase):
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Asset Detail Response (Combined)
class AssetDetailResponse(AssetResponse):
    generator: Optional[GeneratorResponse] = None
    transformer: Optional[TransformerResponse] = None
    motor: Optional[MotorResponse] = None
    plant_name: Optional[str] = None
    company_name: Optional[str] = None

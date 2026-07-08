# backend/app/api/v1/endpoints/assets.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, date

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.assets import Assets
from app.models.hierarchy import Plants
from app.models.generators import Generators
from app.models.transformers import Transformers
from app.models.motors import Motors

router = APIRouter()

# ============================================
# PYDANTIC MODELS
# ============================================

class GeneratorCreate(BaseModel):
    generator_type: Optional[str] = None
    prime_mover_type: Optional[str] = None
    fuel_type: Optional[str] = None
    power_rating_mw: Optional[float] = None
    power_rating_mva: Optional[float] = None
    power_factor: Optional[float] = None
    efficiency_percent: Optional[float] = None
    voltage_kv: Optional[float] = None
    current_a: Optional[float] = None
    frequency_hz: Optional[float] = None
    number_of_phases: Optional[int] = 3
    stator_connection: Optional[str] = None
    rotor_connection: Optional[str] = None
    synchronous_reactance_xd: Optional[float] = None
    transient_reactance_xd: Optional[float] = None
    subtransient_reactance_xd: Optional[float] = None
    inertia_constant_h: Optional[float] = None
    short_circuit_ratio: Optional[float] = None
    rotor_resistance_r2: Optional[float] = None
    stator_resistance_r1: Optional[float] = None
    slip_at_rated_load: Optional[float] = None
    cooling_method: Optional[str] = None
    insulation_class: Optional[str] = None
    bearing_type: Optional[str] = None
    rotor_speed_rpm: Optional[int] = None
    weight_kg: Optional[float] = None
    max_continuous_power_mw: Optional[float] = None
    min_load_percent: Optional[float] = None


class TransformerCreate(BaseModel):
    transformer_type: Optional[str] = None
    cooling_type: Optional[str] = None
    number_of_windings: Optional[int] = 2
    power_rating_mva: Optional[float] = None
    power_rating_mva_forced: Optional[float] = None
    hv_voltage_kv: Optional[float] = None
    lv_voltage_kv: Optional[float] = None
    tertiary_voltage_kv: Optional[float] = None
    hv_tap_range_percent: Optional[float] = None
    number_of_taps: Optional[int] = None
    impedance_percent: Optional[float] = None
    hv_resistance_ohms: Optional[float] = None
    lv_resistance_ohms: Optional[float] = None
    magnetizing_current_percent: Optional[float] = None
    insulation_type: Optional[str] = None
    insulation_class: Optional[str] = None
    insulation_level_hv_kv: Optional[float] = None
    insulation_level_lv_kv: Optional[float] = None
    vector_group: Optional[str] = None
    frequency_hz: Optional[float] = None
    oil_type: Optional[str] = None
    oil_volume_liters: Optional[float] = None
    weight_kg: Optional[float] = None
    no_load_loss_w: Optional[float] = None
    load_loss_w: Optional[float] = None
    efficiency_percent: Optional[float] = None
    temperature_rise_oil_c: Optional[float] = None
    temperature_rise_winding_c: Optional[float] = None
    has_on_load_tap_changer: Optional[bool] = False
    has_buchholz_relay: Optional[bool] = True
    has_pressure_relief: Optional[bool] = True


class MotorCreate(BaseModel):
    motor_type: Optional[str] = None
    frame_size: Optional[str] = None
    mounting_type: Optional[str] = None
    duty_type: Optional[str] = None
    enclosure_type: Optional[str] = None
    power_hp: Optional[float] = None
    power_kw: Optional[float] = None
    service_factor: Optional[float] = None
    voltage_v: Optional[float] = None
    current_a: Optional[float] = None
    starting_current_a: Optional[float] = None
    frequency_hz: Optional[float] = None
    number_of_phases: Optional[int] = 3
    synchronous_speed_rpm: Optional[int] = None
    full_load_speed_rpm: Optional[int] = None
    slip_percent: Optional[float] = None
    nema_design: Optional[str] = None
    efficiency_class: Optional[str] = None
    efficiency_100_percent: Optional[float] = None
    efficiency_75_percent: Optional[float] = None
    efficiency_50_percent: Optional[float] = None
    bearing_type: Optional[str] = None
    shaft_diameter_mm: Optional[float] = None
    weight_kg: Optional[float] = None
    inertia_kg_m2: Optional[float] = None
    insulation_class: Optional[str] = None
    temperature_rise_c: Optional[float] = None
    ip_rating: Optional[str] = None
    vfd_compatible: Optional[bool] = False


class AssetCreate(BaseModel):
    # Basic Asset Fields
    plant_id: int
    asset_type: str
    asset_name: str
    asset_code: str
    asset_tag: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturing_year: Optional[int] = None
    installation_date: Optional[str] = None  # Format: "YYYY-MM-DD"
    commissioning_date: Optional[str] = None  # Format: "YYYY-MM-DD"
    operational_status: Optional[str] = "active"
    criticality_level: Optional[str] = "medium"
    location_within_plant: Optional[str] = None
    technical_documentation_url: Optional[str] = None
    photo_url: Optional[str] = None
    # Asset Specific Fields
    generator: Optional[GeneratorCreate] = None
    transformer: Optional[TransformerCreate] = None
    motor: Optional[MotorCreate] = None


class AssetUpdate(BaseModel):
    plant_id: Optional[int] = None
    asset_type: Optional[str] = None
    asset_name: Optional[str] = None
    asset_code: Optional[str] = None
    asset_tag: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturing_year: Optional[int] = None
    installation_date: Optional[str] = None
    commissioning_date: Optional[str] = None
    operational_status: Optional[str] = None
    criticality_level: Optional[str] = None
    location_within_plant: Optional[str] = None
    technical_documentation_url: Optional[str] = None
    photo_url: Optional[str] = None
    generator: Optional[GeneratorCreate] = None
    transformer: Optional[TransformerCreate] = None
    motor: Optional[MotorCreate] = None


class AssetResponse(BaseModel):
    id: int
    plant_id: int
    asset_type: str
    asset_name: str
    asset_code: str
    asset_tag: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturing_year: Optional[int] = None
    installation_date: Optional[date] = None
    commissioning_date: Optional[date] = None
    operational_status: str
    criticality_level: Optional[str] = None
    location_within_plant: Optional[str] = None
    technical_documentation_url: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    generator: Optional[Dict[str, Any]] = None
    transformer: Optional[Dict[str, Any]] = None
    motor: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# ============================================
# HELPER FUNCTIONS
# ============================================

def parse_date(date_str: Optional[str]) -> Optional[date]:
    """Convert date string to date object"""
    if not date_str:
        return None
    
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y/%m/%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD"
            )


def parse_int(value: Optional[str]) -> Optional[int]:
    """Convert string to int safely"""
    if value is None or value == '':
        return None
    try:
        return int(value)
    except ValueError:
        return None


def parse_float(value: Optional[str]) -> Optional[float]:
    """Convert string to float safely"""
    if value is None or value == '':
        return None
    try:
        return float(value)
    except ValueError:
        return None


# ============================================
# ENDPOINTS
# ============================================

@router.get("/")
async def get_assets(
    plant_id: Optional[int] = None,
    asset_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Assets)
    if plant_id:
        query = query.where(Assets.plant_id == plant_id)
    if asset_type:
        query = query.where(Assets.asset_type == asset_type)
    result = await db.execute(query)
    assets = result.scalars().all()
    
    # Load asset-specific data
    assets_list = []
    for asset in assets:
        asset_dict = {
            "id": asset.id,
            "plant_id": asset.plant_id,
            "asset_type": asset.asset_type,
            "asset_name": asset.asset_name,
            "asset_code": asset.asset_code,
            "asset_tag": asset.asset_tag,
            "manufacturer": asset.manufacturer,
            "model": asset.model,
            "serial_number": asset.serial_number,
            "manufacturing_year": asset.manufacturing_year,
            "installation_date": asset.installation_date,
            "commissioning_date": asset.commissioning_date,
            "operational_status": asset.operational_status,
            "criticality_level": asset.criticality_level,
            "location_within_plant": asset.location_within_plant,
            "technical_documentation_url": asset.technical_documentation_url,
            "photo_url": asset.photo_url,
            "created_at": asset.created_at,
            "updated_at": asset.updated_at
        }
        
        # Load asset-specific data
        if asset.asset_type == "generator":
            generator_result = await db.execute(select(Generators).where(Generators.asset_id == asset.id))
            generator = generator_result.scalar_one_or_none()
            if generator:
                asset_dict["generator"] = generator
        elif asset.asset_type == "transformer":
            transformer_result = await db.execute(select(Transformers).where(Transformers.asset_id == asset.id))
            transformer = transformer_result.scalar_one_or_none()
            if transformer:
                asset_dict["transformer"] = transformer
        elif asset.asset_type == "motor":
            motor_result = await db.execute(select(Motors).where(Motors.asset_id == asset.id))
            motor = motor_result.scalar_one_or_none()
            if motor:
                asset_dict["motor"] = motor
        
        assets_list.append(asset_dict)
    
    return {"items": assets_list, "total": len(assets_list)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset: AssetCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Verify plant exists
    plant_result = await db.execute(select(Plants).where(Plants.id == asset.plant_id))
    if not plant_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Check if asset code exists
    existing = await db.execute(select(Assets).where(Assets.asset_code == asset.asset_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Asset code already exists")
    
    # Convert date strings to date objects
    installation_date = parse_date(asset.installation_date)
    commissioning_date = parse_date(asset.commissioning_date)
    
    # Create basic asset
    new_asset = Assets(
        plant_id=asset.plant_id,
        asset_type=asset.asset_type,
        asset_name=asset.asset_name,
        asset_code=asset.asset_code,
        asset_tag=asset.asset_tag,
        manufacturer=asset.manufacturer,
        model=asset.model,
        serial_number=asset.serial_number,
        manufacturing_year=asset.manufacturing_year,
        installation_date=installation_date,
        commissioning_date=commissioning_date,
        operational_status=asset.operational_status or "active",
        criticality_level=asset.criticality_level or "medium",
        location_within_plant=asset.location_within_plant,
        technical_documentation_url=asset.technical_documentation_url,
        photo_url=asset.photo_url
    )
    db.add(new_asset)
    await db.flush()
    
    # Create asset-specific data
    if asset.asset_type == "generator" and asset.generator:
        generator_data = asset.generator.dict(exclude_unset=True)
        new_generator = Generators(
            asset_id=new_asset.id,
            **generator_data
        )
        db.add(new_generator)
    
    elif asset.asset_type == "transformer" and asset.transformer:
        transformer_data = asset.transformer.dict(exclude_unset=True)
        new_transformer = Transformers(
            asset_id=new_asset.id,
            **transformer_data
        )
        db.add(new_transformer)
    
    elif asset.asset_type == "motor" and asset.motor:
        motor_data = asset.motor.dict(exclude_unset=True)
        new_motor = Motors(
            asset_id=new_asset.id,
            **motor_data
        )
        db.add(new_motor)
    
    await db.commit()
    await db.refresh(new_asset)
    
    return new_asset


@router.get("/{asset_id}")
async def get_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Load asset-specific data
    asset_dict = {
        "id": asset.id,
        "plant_id": asset.plant_id,
        "asset_type": asset.asset_type,
        "asset_name": asset.asset_name,
        "asset_code": asset.asset_code,
        "asset_tag": asset.asset_tag,
        "manufacturer": asset.manufacturer,
        "model": asset.model,
        "serial_number": asset.serial_number,
        "manufacturing_year": asset.manufacturing_year,
        "installation_date": asset.installation_date,
        "commissioning_date": asset.commissioning_date,
        "operational_status": asset.operational_status,
        "criticality_level": asset.criticality_level,
        "location_within_plant": asset.location_within_plant,
        "technical_documentation_url": asset.technical_documentation_url,
        "photo_url": asset.photo_url,
        "created_at": asset.created_at,
        "updated_at": asset.updated_at
    }
    
    if asset.asset_type == "generator":
        generator_result = await db.execute(select(Generators).where(Generators.asset_id == asset.id))
        generator = generator_result.scalar_one_or_none()
        if generator:
            asset_dict["generator"] = generator
    elif asset.asset_type == "transformer":
        transformer_result = await db.execute(select(Transformers).where(Transformers.asset_id == asset.id))
        transformer = transformer_result.scalar_one_or_none()
        if transformer:
            asset_dict["transformer"] = transformer
    elif asset.asset_type == "motor":
        motor_result = await db.execute(select(Motors).where(Motors.asset_id == asset.id))
        motor = motor_result.scalar_one_or_none()
        if motor:
            asset_dict["motor"] = motor
    
    return asset_dict


@router.put("/{asset_id}")
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Get existing asset
    result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Verify plant exists if plant_id is being updated
    if asset_data.plant_id is not None:
        plant_result = await db.execute(select(Plants).where(Plants.id == asset_data.plant_id))
        if not plant_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Plant not found")
    
    # Check if asset code exists (if being changed)
    if asset_data.asset_code is not None and asset_data.asset_code != asset.asset_code:
        existing = await db.execute(select(Assets).where(Assets.asset_code == asset_data.asset_code))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Asset code already exists")
    
    # Update basic asset fields - handle date conversion
    update_data = asset_data.dict(exclude_unset=True, exclude={'generator', 'transformer', 'motor'})
    
    # Convert date strings to date objects if provided
    if 'installation_date' in update_data:
        update_data['installation_date'] = parse_date(update_data['installation_date'])
    
    if 'commissioning_date' in update_data:
        update_data['commissioning_date'] = parse_date(update_data['commissioning_date'])
    
    for key, value in update_data.items():
        setattr(asset, key, value)
    
    # Update asset-specific data
    if asset.asset_type == "generator" and asset_data.generator:
        generator_result = await db.execute(select(Generators).where(Generators.asset_id == asset_id))
        generator = generator_result.scalar_one_or_none()
        if generator:
            update_generator_data = asset_data.generator.dict(exclude_unset=True)
            for key, value in update_generator_data.items():
                setattr(generator, key, value)
        else:
            new_generator = Generators(asset_id=asset_id, **asset_data.generator.dict(exclude_unset=True))
            db.add(new_generator)
    
    elif asset.asset_type == "transformer" and asset_data.transformer:
        transformer_result = await db.execute(select(Transformers).where(Transformers.asset_id == asset_id))
        transformer = transformer_result.scalar_one_or_none()
        if transformer:
            update_transformer_data = asset_data.transformer.dict(exclude_unset=True)
            for key, value in update_transformer_data.items():
                setattr(transformer, key, value)
        else:
            new_transformer = Transformers(asset_id=asset_id, **asset_data.transformer.dict(exclude_unset=True))
            db.add(new_transformer)
    
    elif asset.asset_type == "motor" and asset_data.motor:
        motor_result = await db.execute(select(Motors).where(Motors.asset_id == asset_id))
        motor = motor_result.scalar_one_or_none()
        if motor:
            update_motor_data = asset_data.motor.dict(exclude_unset=True)
            for key, value in update_motor_data.items():
                setattr(motor, key, value)
        else:
            new_motor = Motors(asset_id=asset_id, **asset_data.motor.dict(exclude_unset=True))
            db.add(new_motor)
    
    await db.commit()
    await db.refresh(asset)
    
    return asset


@router.delete("/{asset_id}")
async def delete_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Delete asset-specific data first
    if asset.asset_type == "generator":
        await db.execute(select(Generators).where(Generators.asset_id == asset_id))
        # Get the generator and delete it
        generator_result = await db.execute(select(Generators).where(Generators.asset_id == asset_id))
        generator = generator_result.scalar_one_or_none()
        if generator:
            await db.delete(generator)
    elif asset.asset_type == "transformer":
        transformer_result = await db.execute(select(Transformers).where(Transformers.asset_id == asset_id))
        transformer = transformer_result.scalar_one_or_none()
        if transformer:
            await db.delete(transformer)
    elif asset.asset_type == "motor":
        motor_result = await db.execute(select(Motors).where(Motors.asset_id == asset_id))
        motor = motor_result.scalar_one_or_none()
        if motor:
            await db.delete(motor)
    
    await db.delete(asset)
    await db.commit()
    return {"message": "Asset deleted successfully"}
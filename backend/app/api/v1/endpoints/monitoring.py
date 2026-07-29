"""
Monitoring API Endpoints
File: app/api/v1/endpoints/monitoring.py
Description: API endpoints for live monitoring module
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from app.core.database import get_db, get_dcs_db
from app.core.security import get_current_user_id
from app.models.monitoring import (
    SignalGroup,
    SignalConfiguration,
    SignalVisualizationSettings,
    SignalAlarmHistory,
    ComparisonGroup,
    ComparisonGroupItem
)
from app.models.assets import Assets
from app.models.hierarchy import Plants
from app.schemas.monitoring import (
    SignalGroupCreate,
    SignalGroupUpdate,
    SignalGroupResponse,
    SignalConfigurationCreate,
    SignalConfigurationUpdate,
    SignalConfigurationResponse,
    SignalDataResponse,
    TimelineResponse,
    ComparisonGroupCreate,
    ComparisonGroupUpdate,
    ComparisonGroupResponse,
    ComparisonGroupItemCreate,
    AlarmResponse,
    LatestValueResponse,
    PlantSignalResponse,
    PlantSignalsResponse
)
from app.services.dcs_engine_service import DCSEngineService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/monitoring", tags=["Live Monitoring"])


# ============================================================
# HELPER: Parse date safely
# ============================================================
def parse_date(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return None


# ============================================================
# SIGNAL GROUPS
# ============================================================

@router.get("/plants/{plant_id}/groups", response_model=List[SignalGroupResponse])
async def get_plant_groups(
    plant_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all signal groups for a plant."""
    result = await db.execute(
        select(SignalGroup)
        .where(SignalGroup.plant_id == plant_id)
        .order_by(SignalGroup.sort_order, SignalGroup.group_name)
    )
    groups = result.scalars().all()
    return groups


@router.post("/groups", response_model=SignalGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group: SignalGroupCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new signal group."""
    # Verify plant exists
    plant_result = await db.execute(select(Plants).where(Plants.id == group.plant_id))
    if not plant_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Check if group name already exists for this plant
    existing = await db.execute(
        select(SignalGroup).where(
            SignalGroup.plant_id == group.plant_id,
            SignalGroup.group_name == group.group_name
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Group name already exists for this plant")
    
    new_group = SignalGroup(**group.dict())
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    return new_group


@router.put("/groups/{group_id}", response_model=SignalGroupResponse)
async def update_group(
    group_id: int,
    group: SignalGroupUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update a signal group."""
    result = await db.execute(select(SignalGroup).where(SignalGroup.id == group_id))
    existing = result.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Group not found")
    
    update_data = group.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing, key, value)
    
    await db.commit()
    await db.refresh(existing)
    return existing


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a signal group."""
    result = await db.execute(select(SignalGroup).where(SignalGroup.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    await db.delete(group)
    await db.commit()
    return None


# ============================================================
# PLANT SIGNALS
# ============================================================

@router.get("/plants/{plant_id}/signals", response_model=PlantSignalsResponse)
async def get_plant_signals(
    plant_id: int,
    include_unassigned: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """
    Get all signals for a plant with their configuration and latest values.
    """
    # Verify plant exists
    plant_result = await db.execute(select(Plants).where(Plants.id == plant_id))
    if not plant_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Get signals from DCS engine database
    dcs_service = DCSEngineService(dcs_db)
    dcs_signals = await dcs_service.get_signals_by_plant(plant_id)
    
    if not dcs_signals:
        return PlantSignalsResponse(
            plant_id=plant_id,
            total_signals=0,
            assigned_signals=0,
            signals=[]
        )
    
    # Get configurations from webapp database
    config_result = await db.execute(
        select(SignalConfiguration)
        .where(SignalConfiguration.plant_id == plant_id)
        .where(SignalConfiguration.is_active == True)
    )
    configs = {c.signal_id: c for c in config_result.scalars().all()}
    
    # Get asset names for configs
    asset_ids = [c.asset_id for c in configs.values() if c.asset_id]
    assets = {}
    if asset_ids:
        asset_result = await db.execute(
            select(Assets).where(Assets.id.in_(asset_ids))
        )
        for a in asset_result.scalars().all():
            assets[a.id] = a.asset_name
    
    # Get group names for configs
    group_ids = [c.group_id for c in configs.values() if c.group_id]
    groups = {}
    if group_ids:
        group_result = await db.execute(
            select(SignalGroup).where(SignalGroup.id.in_(group_ids))
        )
        for g in group_result.scalars().all():
            groups[g.id] = g.group_name
    
    # Get latest values
    signal_ids = [s['id'] for s in dcs_signals]
    latest_values = await dcs_service.get_latest_values(signal_ids)
    
    # Build response
    signals_response = []
    assigned_count = 0
    
    for signal in dcs_signals:
        signal_id = signal['id']
        config = configs.get(signal_id)
        
        if not include_unassigned and not config:
            continue
        
        is_assigned = config is not None
        
        signal_resp = PlantSignalResponse(
            signal_id=signal_id,
            plant_id=signal['plant_id'],
            kks_code=signal['kks_code'],
            name=signal['name'],
            description=signal['description'],
            unit=signal['unit'],
            config_id=config.id if config else None,
            asset_id=config.asset_id if config else None,
            asset_name=assets.get(config.asset_id) if config else None,
            group_id=config.group_id if config else None,
            group_name=groups.get(config.group_id) if config else None,
            custom_name=config.custom_name if config else None,
            custom_unit=config.custom_unit if config else None,
            color_hex=config.color_hex if config else None,
            is_visible=config.is_visible if config else True,
            is_assigned=is_assigned
        )
        
        latest = latest_values.get(signal_id)
        if latest:
            signal_resp.latest_value = latest.get('value')
            signal_resp.latest_timestamp = latest.get('timestamp')
            signal_resp.latest_quality = latest.get('quality', True)
            
            if config and config.is_threshold_enabled:
                if (config.alert_threshold_max is not None and 
                    latest.get('value', 0) > config.alert_threshold_max):
                    signal_resp.alarm_status = "critical"
                    signal_resp.alarm_value = latest.get('value')
                elif (config.alert_threshold_min is not None and 
                      latest.get('value', 0) < config.alert_threshold_min):
                    signal_resp.alarm_status = "warning"
                    signal_resp.alarm_value = latest.get('value')
        
        signals_response.append(signal_resp)
        if is_assigned:
            assigned_count += 1
    
    return PlantSignalsResponse(
        plant_id=plant_id,
        total_signals=len(signals_response),
        assigned_signals=assigned_count,
        signals=signals_response
    )


@router.get("/assets/{asset_id}/signals", response_model=List[SignalConfigurationResponse])
async def get_asset_signals(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """Get all signals assigned to a specific asset."""
    asset_result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    config_result = await db.execute(
        select(SignalConfiguration)
        .where(SignalConfiguration.asset_id == asset_id)
        .where(SignalConfiguration.is_active == True)
    )
    configs = config_result.scalars().all()
    
    if not configs:
        return []
    
    signal_ids = [c.signal_id for c in configs]
    dcs_service = DCSEngineService(dcs_db)
    dcs_signals = await dcs_service.get_signals_by_ids(signal_ids)
    signal_map = {s['id']: s for s in dcs_signals}
    
    response = []
    for config in configs:
        signal = signal_map.get(config.signal_id)
        config_dict = {
            "id": config.id,
            "signal_id": config.signal_id,
            "plant_id": config.plant_id,
            "asset_id": config.asset_id,
            "group_id": config.group_id,
            "custom_name": config.custom_name,
            "custom_unit": config.custom_unit,
            "color_hex": config.color_hex,
            "line_type": config.line_type,
            "line_width": config.line_width,
            "scale_factor": config.scale_factor,
            "y_axis_side": config.y_axis_side,
            "alert_threshold_min": config.alert_threshold_min,
            "alert_threshold_max": config.alert_threshold_max,
            "is_threshold_enabled": config.is_threshold_enabled,
            "is_visible": config.is_visible,
            "is_active": config.is_active,
            "assigned_at": config.assigned_at,
            "assigned_by": config.assigned_by,
            "updated_at": config.updated_at,
            "created_at": config.created_at,
            "signal_details": signal,
            "asset_name": asset.asset_name
        }
        response.append(config_dict)
    
    return response


@router.get("/signals/{signal_id}/config", response_model=SignalConfigurationResponse)
async def get_signal_config(
    signal_id: int,
    plant_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """Get configuration for a specific signal."""
    query = select(SignalConfiguration).where(SignalConfiguration.signal_id == signal_id)
    if plant_id:
        query = query.where(SignalConfiguration.plant_id == plant_id)
    
    result = await db.execute(query)
    config = result.scalar_one_or_none()
    
    if not config:
        # Check if signal exists in DCS engine
        dcs_service = DCSEngineService(dcs_db)
        signal = await dcs_service.get_signal_by_id(signal_id)
        if not signal:
            raise HTTPException(status_code=404, detail="Signal not found in DCS engine")
        raise HTTPException(status_code=404, detail="Configuration not found for this signal")
    
    # Add signal details
    dcs_service = DCSEngineService(dcs_db)
    signal = await dcs_service.get_signal_by_id(signal_id)
    config_dict = {
        "id": config.id,
        "signal_id": config.signal_id,
        "plant_id": config.plant_id,
        "asset_id": config.asset_id,
        "group_id": config.group_id,
        "custom_name": config.custom_name,
        "custom_unit": config.custom_unit,
        "color_hex": config.color_hex,
        "line_type": config.line_type,
        "line_width": config.line_width,
        "scale_factor": config.scale_factor,
        "y_axis_side": config.y_axis_side,
        "alert_threshold_min": config.alert_threshold_min,
        "alert_threshold_max": config.alert_threshold_max,
        "is_threshold_enabled": config.is_threshold_enabled,
        "is_visible": config.is_visible,
        "is_active": config.is_active,
        "assigned_at": config.assigned_at,
        "assigned_by": config.assigned_by,
        "updated_at": config.updated_at,
        "created_at": config.created_at,
        "signal_details": signal
    }
    
    return config_dict


@router.put("/signals/{signal_id}/config", response_model=SignalConfigurationResponse)
async def update_signal_config(
    signal_id: int,
    config_update: SignalConfigurationUpdate,
    plant_id: Optional[int] = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """Update configuration for a signal."""
    # Find existing configuration
    query = select(SignalConfiguration).where(SignalConfiguration.signal_id == signal_id)
    if plant_id:
        query = query.where(SignalConfiguration.plant_id == plant_id)
    
    result = await db.execute(query)
    config = result.scalar_one_or_none()
    
    if not config:
        # Check if signal exists in DCS engine
        dcs_service = DCSEngineService(dcs_db)
        signal = await dcs_service.get_signal_by_id(signal_id)
        if not signal:
            raise HTTPException(status_code=404, detail="Signal not found in DCS engine")
        
        # Create new configuration
        create_data = {
            "signal_id": signal_id,
            "plant_id": plant_id or signal['plant_id'],
            "assigned_by": user_id,
            **config_update.dict(exclude_unset=True)
        }
        new_config = SignalConfiguration(**create_data)
        db.add(new_config)
        await db.commit()
        await db.refresh(new_config)
        
        # Return with signal details
        dcs_service = DCSEngineService(dcs_db)
        signal = await dcs_service.get_signal_by_id(signal_id)
        config_dict = {
            "id": new_config.id,
            "signal_id": new_config.signal_id,
            "plant_id": new_config.plant_id,
            "asset_id": new_config.asset_id,
            "group_id": new_config.group_id,
            "custom_name": new_config.custom_name,
            "custom_unit": new_config.custom_unit,
            "color_hex": new_config.color_hex,
            "line_type": new_config.line_type,
            "line_width": new_config.line_width,
            "scale_factor": new_config.scale_factor,
            "y_axis_side": new_config.y_axis_side,
            "alert_threshold_min": new_config.alert_threshold_min,
            "alert_threshold_max": new_config.alert_threshold_max,
            "is_threshold_enabled": new_config.is_threshold_enabled,
            "is_visible": new_config.is_visible,
            "is_active": new_config.is_active,
            "assigned_at": new_config.assigned_at,
            "assigned_by": new_config.assigned_by,
            "updated_at": new_config.updated_at,
            "created_at": new_config.created_at,
            "signal_details": signal
        }
        return config_dict
    
    # Update existing configuration
    update_data = config_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)
    
    config.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(config)
    
    # Return with signal details
    dcs_service = DCSEngineService(dcs_db)
    signal = await dcs_service.get_signal_by_id(signal_id)
    config_dict = {
        "id": config.id,
        "signal_id": config.signal_id,
        "plant_id": config.plant_id,
        "asset_id": config.asset_id,
        "group_id": config.group_id,
        "custom_name": config.custom_name,
        "custom_unit": config.custom_unit,
        "color_hex": config.color_hex,
        "line_type": config.line_type,
        "line_width": config.line_width,
        "scale_factor": config.scale_factor,
        "y_axis_side": config.y_axis_side,
        "alert_threshold_min": config.alert_threshold_min,
        "alert_threshold_max": config.alert_threshold_max,
        "is_threshold_enabled": config.is_threshold_enabled,
        "is_visible": config.is_visible,
        "is_active": config.is_active,
        "assigned_at": config.assigned_at,
        "assigned_by": config.assigned_by,
        "updated_at": config.updated_at,
        "created_at": config.created_at,
        "signal_details": signal
    }
    
    return config_dict


# ============================================================
# SIGNAL DATA
# ============================================================

@router.get("/signals/{signal_id}/data", response_model=SignalDataResponse)
async def get_signal_data(
    signal_id: int,
    time_level: str = Query("raw", description="raw, minute, hour"),
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    hours: int = Query(24, description="Number of hours to fetch (if no start/end time)"),
    max_points: int = Query(10000, le=50000),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """
    Get time-series data for a signal.
    """
    # Validate time_level
    if time_level not in ["raw", "minute", "hour"]:
        raise HTTPException(status_code=400, detail="Invalid time_level. Must be 'raw', 'minute', or 'hour'")
    
    # Parse dates
    start = parse_date(start_time) if start_time else None
    end = parse_date(end_time) if end_time else None
    
    # Set default time range if not provided
    if not end:
        end = datetime.utcnow()
    if not start:
        start = end - timedelta(hours=hours)
    
    # Check time range based on time_level
    if time_level == "raw" and (end - start).days > 30:
        raise HTTPException(status_code=400, detail="Raw data is only available for the last 30 days")
    elif time_level == "minute" and (end - start).days > 730:
        raise HTTPException(status_code=400, detail="Minute data is only available for the last 2 years")
    elif time_level == "hour" and (end - start).days > 10950:
        raise HTTPException(status_code=400, detail="Hour data is only available for the last 30 years")
    
    # Get data from DCS engine
    dcs_service = DCSEngineService(dcs_db)
    
    if time_level == "raw":
        data = await dcs_service.get_raw_data(signal_id, start, end, max_points)
    elif time_level == "minute":
        data = await dcs_service.get_minute_data(signal_id, start, end, max_points)
    else:  # hour
        data = await dcs_service.get_hour_data(signal_id, start, end, max_points)
    
    return SignalDataResponse(
        signal_id=signal_id,
        time_level=time_level,
        start_time=start.isoformat(),
        end_time=end.isoformat(),
        data_points=data,
        total_points=len(data)
    )


@router.get("/signals/{signal_id}/timeline", response_model=TimelineResponse)
async def get_signal_timeline(
    signal_id: int,
    time_level: str = Query("raw", description="raw, minute, hour"),
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    hours: int = Query(24, description="Number of hours to show (if no start/end time)"),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    if time_level not in ["raw", "minute", "hour"]:
        raise HTTPException(status_code=400, detail="Invalid time_level")
    
    # ✅ Parse dates to datetime objects
    start = parse_date(start_time) if start_time else None
    end = parse_date(end_time) if end_time else None
    
    # Set default time range
    if not end:
        end = datetime.utcnow()
    if not start:
        if time_level == "raw":
            start = end - timedelta(days=30)
        elif time_level == "minute":
            start = end - timedelta(days=365)
        else:  # hour
            start = end - timedelta(days=3650)
    
    dcs_service = DCSEngineService(dcs_db)
    
    if time_level == "raw":
        intervals = await dcs_service.get_raw_timeline(signal_id, start, end, interval_minutes=60)
    elif time_level == "minute":
        intervals = await dcs_service.get_minute_timeline(signal_id, start, end, interval_days=1)
    else:  # hour
        intervals = await dcs_service.get_hour_timeline(signal_id, start, end, interval_days=30)
    
    return TimelineResponse(
        signal_id=signal_id,
        time_level=time_level,
        intervals=intervals,
        total_intervals=len(intervals)
    )

@router.get("/signals/{signal_id}/latest", response_model=LatestValueResponse)
async def get_signal_latest(
    signal_id: int,
    db: AsyncSession = Depends(get_db),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """Get the latest value for a signal with its configuration."""
    dcs_service = DCSEngineService(dcs_db)
    latest = await dcs_service.get_latest_value(signal_id)
    
    if not latest:
        raise HTTPException(status_code=404, detail="No data found for this signal")
    
    # Get signal metadata
    signal = await dcs_service.get_signal_by_id(signal_id)
    
    # Get configuration from webapp
    config_result = await db.execute(
        select(SignalConfiguration).where(SignalConfiguration.signal_id == signal_id)
    )
    config = config_result.scalar_one_or_none()
    
    # Determine status
    status = "normal"
    if config and config.is_threshold_enabled:
        value = latest.get('value', 0)
        if config.alert_threshold_max is not None and value > config.alert_threshold_max:
            status = "critical"
        elif config.alert_threshold_min is not None and value < config.alert_threshold_min:
            status = "warning"
    
    return LatestValueResponse(
        signal_id=signal_id,
        timestamp=latest['timestamp'],
        value=latest['value'],
        quality=latest['quality'],
        rms=latest.get('rms'),
        rate_of_change=latest.get('rate_of_change'),
        signal_name=signal['name'] if signal else None,
        unit=signal['unit'] if signal else None,
        color_hex=config.color_hex if config else None,
        status=status
    )


# ============================================================
# SIGNAL DATA RANGE
# ============================================================

@router.get("/signals/{signal_id}/range")
async def get_signal_data_range(
    signal_id: int,
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """
    Get the actual data range (min/max timestamp) for a signal.
    """
    dcs_service = DCSEngineService(dcs_db)
    range_data = await dcs_service.get_data_range(signal_id)
    return range_data


# ============================================================
# SIGNAL ASSIGNMENT
# ============================================================

@router.post("/signals/{signal_id}/assign", status_code=status.HTTP_201_CREATED)
async def assign_signal_to_asset(
    signal_id: int,
    asset_id: int = Query(...),
    plant_id: int = Query(...),
    group_id: Optional[int] = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """Assign a DCS signal to an asset."""
    # Verify signal exists in DCS engine
    dcs_service = DCSEngineService(dcs_db)
    signal = await dcs_service.get_signal_by_id(signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found in DCS engine")
    
    # Verify asset exists
    asset_result = await db.execute(select(Assets).where(Assets.id == asset_id))
    if not asset_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Verify plant exists
    plant_result = await db.execute(select(Plants).where(Plants.id == plant_id))
    if not plant_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Check if configuration already exists
    existing = await db.execute(
        select(SignalConfiguration).where(
            SignalConfiguration.signal_id == signal_id,
            SignalConfiguration.plant_id == plant_id
        )
    )
    config = existing.scalar_one_or_none()
    
    if config:
        config.asset_id = asset_id
        config.group_id = group_id
        config.is_active = True
        config.assigned_by = user_id
        config.assigned_at = datetime.utcnow()
        await db.commit()
        await db.refresh(config)
        return {"message": "Signal assigned successfully", "config_id": config.id}
    
    new_config = SignalConfiguration(
        signal_id=signal_id,
        plant_id=plant_id,
        asset_id=asset_id,
        group_id=group_id,
        assigned_by=user_id,
        is_active=True,
        color_hex="#2196F3",
        line_type="solid",
        line_width=2,
        scale_factor=1.0
    )
    db.add(new_config)
    await db.commit()
    await db.refresh(new_config)
    
    return {"message": "Signal assigned successfully", "config_id": new_config.id}


@router.delete("/signals/{signal_id}/assign", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_signal(
    signal_id: int,
    plant_id: int = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Remove assignment of a signal from an asset."""
    result = await db.execute(
        select(SignalConfiguration).where(
            SignalConfiguration.signal_id == signal_id,
            SignalConfiguration.plant_id == plant_id
        )
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Signal configuration not found")
    
    config.asset_id = None
    config.is_active = False
    await db.commit()
    
    return None


# ============================================================
# COMPARISON GROUPS
# ============================================================

@router.get("/plants/{plant_id}/comparison-groups", response_model=List[ComparisonGroupResponse])
async def get_comparison_groups(
    plant_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all comparison groups for a plant."""
    result = await db.execute(
        select(ComparisonGroup)
        .where(ComparisonGroup.plant_id == plant_id)
        .order_by(ComparisonGroup.name)
    )
    groups = result.scalars().all()
    
    # Load items for each group
    for group in groups:
        items_result = await db.execute(
            select(ComparisonGroupItem)
            .where(ComparisonGroupItem.comparison_group_id == group.id)
        )
        group.items = items_result.scalars().all()
    
    return groups


@router.post("/comparison-groups", response_model=ComparisonGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_comparison_group(
    group: ComparisonGroupCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new comparison group."""
    plant_result = await db.execute(select(Plants).where(Plants.id == group.plant_id))
    if not plant_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plant not found")
    
    new_group = ComparisonGroup(
        **group.dict(),
        created_by=user_id
    )
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    return new_group


@router.post("/comparison-groups/{group_id}/items", status_code=status.HTTP_201_CREATED)
async def add_to_comparison_group(
    group_id: int,
    item: ComparisonGroupItemCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a signal to a comparison group."""
    group_result = await db.execute(select(ComparisonGroup).where(ComparisonGroup.id == group_id))
    if not group_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Comparison group not found")
    
    config_result = await db.execute(
        select(SignalConfiguration).where(SignalConfiguration.id == item.signal_config_id)
    )
    if not config_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Signal configuration not found")
    
    existing = await db.execute(
        select(ComparisonGroupItem).where(
            ComparisonGroupItem.comparison_group_id == group_id,
            ComparisonGroupItem.signal_config_id == item.signal_config_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Signal already in this comparison group")
    
    new_item = ComparisonGroupItem(
        comparison_group_id=group_id,
        signal_config_id=item.signal_config_id
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return {"message": "Added to comparison group", "id": new_item.id}


@router.delete("/comparison-groups/{group_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_comparison_group(
    group_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Remove a signal from a comparison group."""
    result = await db.execute(
        select(ComparisonGroupItem).where(
            ComparisonGroupItem.id == item_id,
            ComparisonGroupItem.comparison_group_id == group_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in comparison group")
    
    await db.delete(item)
    await db.commit()
    return None


@router.delete("/comparison-groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comparison_group(
    group_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a comparison group."""
    result = await db.execute(select(ComparisonGroup).where(ComparisonGroup.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Comparison group not found")
    
    await db.delete(group)
    await db.commit()
    return None


# ============================================================
# COMPARISON DATA
# ============================================================

@router.get("/plants/{plant_id}/compare")
async def get_comparison_data(
    plant_id: int,
    group_id: int,
    time_level: str = Query("raw", description="raw, minute, hour"),
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    hours: int = Query(24),
    db: AsyncSession = Depends(get_db),
    dcs_db: AsyncSession = Depends(get_dcs_db)
):
    """
    Get comparison data for a specific group across all assets.
    """
    if time_level not in ["raw", "minute", "hour"]:
        raise HTTPException(status_code=400, detail="Invalid time_level")
    
    # Parse dates
    start = parse_date(start_time) if start_time else None
    end = parse_date(end_time) if end_time else None
    
    if not end:
        end = datetime.utcnow()
    if not start:
        start = end - timedelta(hours=hours)
    
    group_result = await db.execute(select(ComparisonGroup).where(ComparisonGroup.id == group_id))
    group = group_result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Comparison group not found")
    
    items_result = await db.execute(
        select(ComparisonGroupItem).where(ComparisonGroupItem.comparison_group_id == group_id)
    )
    items = items_result.scalars().all()
    
    if not items:
        return {"group": {"id": group.id, "name": group.name}, "signals": []}
    
    config_ids = [item.signal_config_id for item in items]
    config_result = await db.execute(
        select(SignalConfiguration).where(SignalConfiguration.id.in_(config_ids))
    )
    configs = config_result.scalars().all()
    signal_ids = [c.signal_id for c in configs]
    
    dcs_service = DCSEngineService(dcs_db)
    
    result_data = []
    for config in configs:
        if time_level == "raw":
            data = await dcs_service.get_raw_data(config.signal_id, start, end)
        elif time_level == "minute":
            data = await dcs_service.get_minute_data(config.signal_id, start, end)
        else:
            data = await dcs_service.get_hour_data(config.signal_id, start, end)
        
        signal = await dcs_service.get_signal_by_id(config.signal_id)
        
        result_data.append({
            "signal_id": config.signal_id,
            "signal_name": signal.get('name') if signal else f"Signal_{config.signal_id}",
            "asset_id": config.asset_id,
            "color_hex": config.color_hex,
            "data": data
        })
    
    return {
        "group": {
            "id": group.id,
            "name": group.name,
            "group_type": group.group_type
        },
        "signals": result_data
    }


# ============================================================
# ALARMS
# ============================================================

@router.get("/alarms/active", response_model=List[AlarmResponse])
async def get_active_alarms(
    asset_id: Optional[int] = None,
    plant_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all active (not cleared) alarms."""
    query = select(SignalAlarmHistory).where(
        SignalAlarmHistory.is_cleared == False
    )
    
    if asset_id:
        query = query.where(SignalAlarmHistory.asset_id == asset_id)
    
    if plant_id:
        query = query.join(SignalConfiguration).where(
            SignalConfiguration.plant_id == plant_id
        )
    
    query = query.order_by(SignalAlarmHistory.triggered_at.desc())
    
    result = await db.execute(query)
    alarms = result.scalars().all()
    
    response = []
    for alarm in alarms:
        config_result = await db.execute(
            select(SignalConfiguration).where(SignalConfiguration.id == alarm.signal_config_id)
        )
        config = config_result.scalar_one_or_none()
        
        asset_name = None
        if alarm.asset_id:
            asset_result = await db.execute(
                select(Assets).where(Assets.id == alarm.asset_id)
            )
            asset = asset_result.scalar_one_or_none()
            if asset:
                asset_name = asset.asset_name
        
        alarm_dict = {
            "id": alarm.id,
            "signal_config_id": alarm.signal_config_id,
            "asset_id": alarm.asset_id,
            "alarm_type": alarm.alarm_type,
            "triggered_value": alarm.triggered_value,
            "threshold_value": alarm.threshold_value,
            "severity": alarm.severity,
            "triggered_at": alarm.triggered_at,
            "acknowledged_at": alarm.acknowledged_at,
            "acknowledged_by": alarm.acknowledged_by,
            "cleared_at": alarm.cleared_at,
            "is_cleared": alarm.is_cleared,
            "notes": alarm.notes,
            "signal_name": config.custom_name if config else None,
            "asset_name": asset_name
        }
        response.append(alarm_dict)
    
    return response


@router.post("/alarms/{alarm_id}/acknowledge")
async def acknowledge_alarm(
    alarm_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Acknowledge an alarm."""
    result = await db.execute(
        select(SignalAlarmHistory).where(SignalAlarmHistory.id == alarm_id)
    )
    alarm = result.scalar_one_or_none()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    
    alarm.acknowledged_at = datetime.utcnow()
    alarm.acknowledged_by = user_id
    
    await db.commit()
    
    return {"message": "Alarm acknowledged"}


@router.post("/alarms/{alarm_id}/clear")
async def clear_alarm(
    alarm_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Clear an alarm."""
    result = await db.execute(
        select(SignalAlarmHistory).where(SignalAlarmHistory.id == alarm_id)
    )
    alarm = result.scalar_one_or_none()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    
    alarm.cleared_at = datetime.utcnow()
    alarm.is_cleared = True
    
    await db.commit()
    
    return {"message": "Alarm cleared"}
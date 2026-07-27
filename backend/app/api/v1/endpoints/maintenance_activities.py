# backend/app/api/v1/endpoints/maintenance_activities.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, text
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, date
import json

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.maintenance_activities import MaintenanceActivities
from app.models.assets import Assets
from app.models.hierarchy import Plants

router = APIRouter()

# ============================================
# PYDANTIC MODELS
# ============================================

class MaintenanceActivityCreate(BaseModel):
    # Core Activity Details (user fills these)
    title: str
    description: Optional[str] = None
    maintenance_order: str  # minor, major, emergency, overhaul
    maintenance_section: str  # contextual based on asset_type
    oil_detail:str 
    priority: str  # low, medium, high, critical
    scheduled_date: Optional[str] = None  # "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD"
    assigned_technician: Optional[int] = None
    meter_reading: Optional[float] = None
    labor_cost: Optional[float] = 0.0
    parts_cost: Optional[float] = 0.0
    findings_description: Optional[str] = None
    action_taken: Optional[str] = None
    attachments: Optional[List[str]] = []  # array of file URLs
    recommended_next_date: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = {}  # asset-specific readings


class MaintenanceActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    maintenance_order: Optional[str] = None
    maintenance_section: Optional[str] = None
    oil_detail: Optional[str] = None
    priority: Optional[str] = None
    scheduled_date: Optional[str] = None
    assigned_technician: Optional[int] = None
    meter_reading: Optional[float] = None
    labor_cost: Optional[float] = None
    parts_cost: Optional[float] = None
    findings_description: Optional[str] = None
    action_taken: Optional[str] = None
    attachments: Optional[List[str]] = None
    recommended_next_date: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None
    status: Optional[str] = None  # allow updating status via workflow


# ============================================
# HELPER FUNCTIONS
# ============================================

def parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Convert ISO format datetime string to datetime object"""
    if not dt_str:
        return None
    try:
        if '+' in dt_str or dt_str.endswith('Z'):
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        else:
            return datetime.fromisoformat(dt_str)
    except ValueError:
        try:
            return datetime.strptime(dt_str, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid datetime format: '{dt_str}'. Expected ISO format"
            )


async def get_asset_type_and_plant(asset_id: int, db: AsyncSession) -> tuple:
    """Fetch asset type and plant_id from asset_id, raise if not found"""
    result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset.asset_type, asset.plant_id


def calculate_downtime(start: Optional[datetime], end: Optional[datetime]) -> int:
    """Calculate downtime in minutes between two datetimes"""
    if not start or not end:
        return 0
    if end <= start:
        return 0
    delta = end - start
    return int(delta.total_seconds() // 60)


# ============================================
# ENDPOINTS
# ============================================

@router.get("/")
async def get_maintenance_activities(
    asset_id: Optional[int] = None,
    plant_id: Optional[int] = None,
    status: Optional[str] = None,
    maintenance_order: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all maintenance activities with filters.
    """
    query = select(MaintenanceActivities)
    
    if asset_id:
        query = query.where(MaintenanceActivities.asset_id == asset_id)
    elif plant_id:
        query = query.where(MaintenanceActivities.plant_id == plant_id)
    
    if status:
        query = query.where(MaintenanceActivities.status == status)
    if maintenance_order:
        query = query.where(MaintenanceActivities.maintenance_order == maintenance_order)
    if priority:
        query = query.where(MaintenanceActivities.priority == priority)
    
    query = query.order_by(desc(MaintenanceActivities.scheduled_date)).offset(skip).limit(limit)
    result = await db.execute(query)
    activities = result.scalars().all()
    
    # Enrich with asset details
    response_items = []
    for act in activities:
        asset_result = await db.execute(select(Assets).where(Assets.id == act.asset_id))
        asset = asset_result.scalar_one_or_none()
        
        item = {
            "id": act.id,
            "plant_id": act.plant_id,
            "asset_id": act.asset_id,
            "title": act.title,
            "description": act.description,
            "maintenance_order": act.maintenance_order,
            "maintenance_section": act.maintenance_section,
            "oil_detail" : act.oil_detail,
            "priority": act.priority,
            "status": act.status,
            "scheduled_date": act.scheduled_date,
            "actual_start": act.actual_start,
            "completion_date": act.completion_date,
            "assigned_technician": act.assigned_technician,
            "meter_reading": act.meter_reading,
            "downtime_minutes": act.downtime_minutes,
            "labor_cost": act.labor_cost,
            "parts_cost": act.parts_cost,
            # ✅ Compute total_cost from the two fields
            "total_cost": (act.labor_cost or 0) + (act.parts_cost or 0),
            "findings_description": act.findings_description,
            "action_taken": act.action_taken,
            "attachments": act.attachments or [],
            "recommended_next_date": act.recommended_next_date,
            "extra_data": act.extra_data or {},
            "created_at": act.created_at,
            "updated_at": act.updated_at,
            "created_by": act.created_by,
            "asset_name": asset.asset_name if asset else None,
            "asset_code": asset.asset_code if asset else None,
            "asset_type": asset.asset_type if asset else None,
        }
        response_items.append(item)
    
    return {"items": response_items, "total": len(response_items)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_maintenance_activity(
    activity: MaintenanceActivityCreate,
    asset_id: int,  # passed as query param: ?asset_id=123
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new maintenance activity for a specific asset.
    """
    # Validate asset and get its type and plant_id
    asset_type, plant_id = await get_asset_type_and_plant(asset_id, db)
    
    # Parse datetime fields
    scheduled_dt = parse_datetime(activity.scheduled_date) if activity.scheduled_date else None
    recommended_dt = parse_datetime(activity.recommended_next_date) if activity.recommended_next_date else None
    
    # Serialize JSON fields for raw SQL
    attachments_json = json.dumps(activity.attachments or [])
    extra_data_json = json.dumps(activity.extra_data or {})
    
    # Use raw SQL to avoid inserting into generated column 'total_cost'
    sql = text("""
        INSERT INTO maintenance_activities (
            plant_id, asset_id, title, description, maintenance_order,
            maintenance_section,oil_detail, priority, status, scheduled_date,
            assigned_technician, meter_reading, labor_cost, parts_cost,
            findings_description, action_taken, attachments,
            recommended_next_date, extra_data, created_by
        ) VALUES (
            :plant_id, :asset_id, :title, :description, :maintenance_order,
            :maintenance_section, :oil_detail, :priority, :status, :scheduled_date,
            :assigned_technician, :meter_reading, :labor_cost, :parts_cost,
            :findings_description, :action_taken, :attachments,
            :recommended_next_date, :extra_data, :created_by
        ) RETURNING id
    """)
    
    result = await db.execute(sql, {
        'plant_id': plant_id,
        'asset_id': asset_id,
        'title': activity.title,
        'description': activity.description,
        'maintenance_order': activity.maintenance_order,
        'maintenance_section': activity.maintenance_section,
        'oil_detail':activity.oil_detail,
        'priority': activity.priority,
        'status': 'planned',
        'scheduled_date': scheduled_dt,
        'assigned_technician': activity.assigned_technician,
        'meter_reading': activity.meter_reading,
        'labor_cost': activity.labor_cost or 0.0,
        'parts_cost': activity.parts_cost or 0.0,
        'findings_description': activity.findings_description,
        'action_taken': activity.action_taken,
        'attachments': attachments_json,
        'recommended_next_date': recommended_dt,
        'extra_data': extra_data_json,
        'created_by': user_id
    })
    
    await db.commit()
    row = result.fetchone()
    inserted_id = row[0]
    
    # Return the created activity using the GET endpoint
    return await get_maintenance_activity(inserted_id, db)


@router.get("/{activity_id}")
async def get_maintenance_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MaintenanceActivities).where(MaintenanceActivities.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Maintenance activity not found")
    
    # Fetch asset details
    asset_result = await db.execute(select(Assets).where(Assets.id == activity.asset_id))
    asset = asset_result.scalar_one_or_none()
    
    response = {
        "id": activity.id,
        "plant_id": activity.plant_id,
        "asset_id": activity.asset_id,
        "title": activity.title,
        "description": activity.description,
        "maintenance_order": activity.maintenance_order,
        "maintenance_section": activity.maintenance_section,
        "oil_detail": activity.oil_detail,
        "priority": activity.priority,
        "status": activity.status,
        "scheduled_date": activity.scheduled_date,
        "actual_start": activity.actual_start,
        "completion_date": activity.completion_date,
        "assigned_technician": activity.assigned_technician,
        "meter_reading": activity.meter_reading,
        "downtime_minutes": activity.downtime_minutes,
        "labor_cost": activity.labor_cost,
        "parts_cost": activity.parts_cost,
        # ✅ Compute total_cost from the two fields
        "total_cost": (activity.labor_cost or 0) + (activity.parts_cost or 0),
        "findings_description": activity.findings_description,
        "action_taken": activity.action_taken,
        "attachments": activity.attachments or [],
        "recommended_next_date": activity.recommended_next_date,
        "extra_data": activity.extra_data or {},
        "created_at": activity.created_at,
        "updated_at": activity.updated_at,
        "created_by": activity.created_by,
        "asset_name": asset.asset_name if asset else None,
        "asset_code": asset.asset_code if asset else None,
        "asset_type": asset.asset_type if asset else None,
    }
    return response


@router.put("/{activity_id}")
async def update_maintenance_activity(
    activity_id: int,
    activity_data: MaintenanceActivityUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Get existing activity
    result = await db.execute(select(MaintenanceActivities).where(MaintenanceActivities.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Maintenance activity not found")
    
    # Prepare update data
    update_dict = activity_data.dict(exclude_unset=True)
    
    # Handle datetime conversions
    if 'scheduled_date' in update_dict:
        update_dict['scheduled_date'] = parse_datetime(update_dict['scheduled_date'])
    if 'recommended_next_date' in update_dict:
        update_dict['recommended_next_date'] = parse_datetime(update_dict['recommended_next_date'])
    
    # If status is being updated to 'in_progress', set actual_start
    if 'status' in update_dict and update_dict['status'] == 'in_progress' and activity.actual_start is None:
        update_dict['actual_start'] = datetime.utcnow()
    
    # If status is being updated to 'completed', set completion_date and calculate downtime
    if 'status' in update_dict and update_dict['status'] == 'completed':
        update_dict['completion_date'] = datetime.utcnow()
        start_time = activity.actual_start or activity.scheduled_date
        if start_time:
            update_dict['downtime_minutes'] = calculate_downtime(start_time, update_dict['completion_date'])
        else:
            update_dict['downtime_minutes'] = 0
    
    # Apply updates
    for key, value in update_dict.items():
        setattr(activity, key, value)
    
    await db.commit()
    await db.refresh(activity)
    
    # Return the updated activity
    return await get_maintenance_activity(activity_id, db)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance_activity(
    activity_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MaintenanceActivities).where(MaintenanceActivities.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Maintenance activity not found")
    
    await db.delete(activity)
    await db.commit()
    return None
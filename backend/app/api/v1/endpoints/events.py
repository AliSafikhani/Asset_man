from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
import os
import shutil

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.assets import Assets
from app.models.events import MaintenanceEvent, EventAttachment

router = APIRouter(prefix="/events", tags=["Maintenance Events"])

# Pydantic models
class EventCreate(BaseModel):
    asset_id: int
    event_date: date
    event_type: Optional[str] = None
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    actions_taken: Optional[str] = None
    recommendations: Optional[str] = None
    cost: Optional[float] = None
    downtime_hours: Optional[float] = None

class EventResponse(EventCreate):
    id: int
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class EventDetailResponse(EventResponse):
    attachments: List[dict] = []

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event: EventCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new maintenance event for an asset"""
    
    # Verify asset exists
    asset_result = await db.execute(select(Assets).where(Assets.id == event.asset_id))
    if not asset_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    new_event = MaintenanceEvent(
        **event.dict(),
        created_by=user_id
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    
    return new_event

@router.get("/asset/{asset_id}", response_model=List[EventResponse])
async def get_asset_events(
    asset_id: int,
    limit: int = 50,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all maintenance events for an asset"""
    
    result = await db.execute(
        select(MaintenanceEvent)
        .where(MaintenanceEvent.asset_id == asset_id)
        .order_by(desc(MaintenanceEvent.event_date))
        .limit(limit)
    )
    events = result.scalars().all()
    return events

@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific maintenance event with attachments"""
    
    result = await db.execute(
        select(MaintenanceEvent).where(MaintenanceEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get attachments
    attachments_result = await db.execute(
        select(EventAttachment).where(EventAttachment.event_id == event_id)
    )
    attachments = attachments_result.scalars().all()
    
    response = EventDetailResponse.model_validate(event)
    response.attachments = [{"id": a.id, "file_name": a.file_name, "file_size": a.file_size} for a in attachments]
    
    return response

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_update: EventCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update a maintenance event"""
    
    result = await db.execute(
        select(MaintenanceEvent).where(MaintenanceEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in event_update.dict().items():
        setattr(event, key, value)
    
    await db.commit()
    await db.refresh(event)
    
    return event

@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a maintenance event"""
    
    result = await db.execute(
        select(MaintenanceEvent).where(MaintenanceEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await db.delete(event)
    await db.commit()
    
    return {"message": "Event deleted successfully"}

@router.post("/{event_id}/attachments")
async def upload_attachment(
    event_id: int,
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Upload an attachment for an event"""
    
    # Verify event exists
    result = await db.execute(
        select(MaintenanceEvent).where(MaintenanceEvent.id == event_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Create upload directory if not exists
    upload_dir = "uploads/events"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = f"{upload_dir}/{event_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save to database
    attachment = EventAttachment(
        event_id=event_id,
        file_name=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path)
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    
    return {"id": attachment.id, "file_name": attachment.file_name, "message": "File uploaded successfully"}

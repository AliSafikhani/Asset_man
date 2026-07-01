from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.alarm_event_models import Event, EventChecklist, EventPart, EventComment
from app.models.assets import Assets

router = APIRouter()

class EventCreate(BaseModel):
    title: str = Field(..., max_length=500)
    asset_id: int
    event_type: str = Field(..., pattern="^(maintenance|failure|inspection|test|repair|replacement)$")
    priority: str = Field(..., pattern="^(critical|high|medium|low)$")
    reported_date: date
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(open|in_progress|completed|cancelled|on_hold)$")
    priority: Optional[str] = Field(None, pattern="^(critical|high|medium|low)$")
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    actions_taken: Optional[str] = None
    cost: Optional[float] = None
    downtime_hours: Optional[float] = None

class EventResponse(BaseModel):
    id: int
    event_number: str
    title: str
    asset_id: int
    event_type: str
    priority: str
    status: str
    reported_date: date
    description: Optional[str]
    assigned_to: Optional[int]
    due_date: Optional[date]
    completed_date: Optional[date]
    actions_taken: Optional[str]
    cost: Optional[float]
    downtime_hours: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True

class ChecklistItemCreate(BaseModel):
    task_name: str

class PartCreate(BaseModel):
    part_name: str
    quantity: int = 1
    unit_cost: Optional[float] = None

class CommentCreate(BaseModel):
    comment: str

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event: EventCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new event/work order"""
    
    # Verify asset exists
    asset_result = await db.execute(select(Assets).where(Assets.id == event.asset_id))
    if not asset_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Generate event number
    year = datetime.now().year
    result = await db.execute(select(Event).where(Event.event_number.like(f'WO-{year}-%')).order_by(desc(Event.id)))
    last_event = result.scalar_one_or_none()
    if last_event:
        last_num = int(last_event.event_number.split('-')[-1])
        next_num = last_num + 1
    else:
        next_num = 1
    
    event_number = f"WO-{year}-{next_num:04d}"
    
    new_event = Event(
        event_number=event_number,
        title=event.title,
        asset_id=event.asset_id,
        event_type=event.event_type,
        priority=event.priority,
        reported_date=event.reported_date,
        description=event.description,
        assigned_to=event.assigned_to,
        due_date=event.due_date,
        reported_by=user_id
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return new_event

@router.get("/", response_model=List[EventResponse])
async def get_events(
    asset_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all events with filters"""
    query = select(Event).order_by(desc(Event.created_at)).limit(limit)
    if asset_id:
        query = query.where(Event.asset_id == asset_id)
    if status:
        query = query.where(Event.status == status)
    if priority:
        query = query.where(Event.priority == priority)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific event"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_update: EventUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update an event"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in event_update.dict(exclude_unset=True).items():
        setattr(event, key, value)
    
    if event_update.status == "completed" and not event.completed_date:
        event.completed_date = date.today()
    
    await db.commit()
    await db.refresh(event)
    return event

@router.post("/{event_id}/checklist")
async def add_checklist_item(
    event_id: int,
    item: ChecklistItemCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Add a checklist item to an event"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")
    
    checklist_item = EventChecklist(event_id=event_id, task_name=item.task_name)
    db.add(checklist_item)
    await db.commit()
    return {"message": "Checklist item added", "id": checklist_item.id}

@router.put("/checklist/{item_id}")
async def complete_checklist_item(
    item_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Mark checklist item as completed"""
    result = await db.execute(select(EventChecklist).where(EventChecklist.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    item.is_completed = True
    item.completed_by = user_id
    item.completed_at = datetime.utcnow()
    await db.commit()
    return {"message": "Checklist item completed"}

@router.post("/{event_id}/parts")
async def add_part(
    event_id: int,
    part: PartCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Add a part to an event"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")
    
    total_cost = part.quantity * (part.unit_cost or 0)
    event_part = EventPart(
        event_id=event_id,
        part_name=part.part_name,
        quantity=part.quantity,
        unit_cost=part.unit_cost,
        total_cost=total_cost
    )
    db.add(event_part)
    await db.commit()
    return {"message": "Part added", "id": event_part.id}

@router.post("/{event_id}/comments")
async def add_comment(
    event_id: int,
    comment: CommentCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Add a comment to an event"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")
    
    event_comment = EventComment(event_id=event_id, comment=comment.comment, created_by=user_id)
    db.add(event_comment)
    await db.commit()
    return {"message": "Comment added", "id": event_comment.id}

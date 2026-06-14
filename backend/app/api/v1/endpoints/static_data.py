"""
Static data endpoints for handling 10k+ records with pagination
Simplified version for initial testing
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.static_record import StaticRecord

router = APIRouter(prefix="/static-data", tags=["Static Data"])


@router.get("")
async def get_static_data(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term"),
    category: Optional[str] = Query(None, description="Filter by category"),
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated static data with filtering
    """
    # Build base query
    query = select(StaticRecord).where(StaticRecord.is_deleted == False)
    count_query = select(func.count()).select_from(StaticRecord).where(StaticRecord.is_deleted == False)
    
    # Apply filters
    if search:
        search_filter = or_(
            StaticRecord.title.ilike(f"%{search}%"),
            StaticRecord.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    if category:
        query = query.where(StaticRecord.category == category)
        count_query = count_query.where(StaticRecord.category == category)
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(StaticRecord.created_at.desc()).offset(offset).limit(page_size)
    
    # Execute queries
    result = await db.execute(query)
    items = result.scalars().all()
    
    total_result = await db.execute(count_query)
    total_count = total_result.scalar()
    
    # Calculate total pages
    total_pages = (total_count + page_size - 1) // page_size
    
    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1
    }


@router.get("/{record_id}")
async def get_static_data_by_id(
    record_id: int,
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a single static data record by ID"""
    result = await db.execute(
        select(StaticRecord).where(
            StaticRecord.id == record_id,
            StaticRecord.is_deleted == False
        )
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    return record


@router.post("", status_code=201)
async def create_static_data(
    title: str,
    description: Optional[str] = None,
    category: Optional[str] = None,
    value: dict = None,
    tags: List[str] = [],
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new static data record"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    new_record = StaticRecord(
        title=title,
        description=description,
        category=category,
        value=value or {},
        tags=tags,
        created_by=user_id,
        updated_by=user_id
    )
    
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    
    return new_record


@router.put("/{record_id}")
async def update_static_data(
    record_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None,
    value: Optional[dict] = None,
    tags: Optional[List[str]] = None,
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing static data record"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    result = await db.execute(
        select(StaticRecord).where(StaticRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if title is not None:
        record.title = title
    if description is not None:
        record.description = description
    if category is not None:
        record.category = category
    if value is not None:
        record.value = value
    if tags is not None:
        record.tags = tags
    
    record.updated_by = user_id
    record.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(record)
    
    return record


@router.delete("/{record_id}")
async def delete_static_data(
    record_id: int,
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a static data record"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    result = await db.execute(
        select(StaticRecord).where(StaticRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record.is_deleted = True
    record.updated_by = user_id
    
    await db.commit()
    
    return {"message": "Record deleted successfully", "id": record_id}


@router.get("/categories/list")
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    """Get all unique categories"""
    result = await db.execute(
        select(StaticRecord.category.distinct())
        .where(StaticRecord.category.isnot(None))
        .where(StaticRecord.is_deleted == False)
    )
    categories = result.scalars().all()
    return categories
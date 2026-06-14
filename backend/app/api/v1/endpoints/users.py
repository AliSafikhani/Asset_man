"""
User management endpoints - Simplified version
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all users (requires authentication)"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    query = select(User).where(User.is_active == True).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.get("/{user_id_param}")
async def get_user_by_id(
    user_id_param: int,
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    result = await db.execute(select(User).where(User.id == user_id_param))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at
    }


@router.put("/{user_id_param}")
async def update_user(
    user_id_param: int,
    full_name: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update user (admin only or self)"""
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    result = await db.execute(select(User).where(User.id == user_id_param))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only admin or the user themselves can update
    # For simplicity, allow any authenticated user to update their own info
    if current_user_id != user_id_param:
        # Check if current user is admin (simplified)
        current_user_result = await db.execute(select(User).where(User.id == current_user_id))
        current_user = current_user_result.scalar_one_or_none()
        if not current_user or current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
    
    if full_name is not None:
        user.full_name = full_name
    if is_active is not None and current_user_id == 1:  # Only admin can deactivate
        user.is_active = is_active
    
    await db.commit()
    
    return {"message": "User updated successfully"}


@router.delete("/{user_id_param}")
async def delete_user(
    user_id_param: int,
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete user (admin only)"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check if current user is admin (simplified - user_id 1 is admin)
    if user_id != 1:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.execute(select(User).where(User.id == user_id_param))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    
    return {"message": "User deleted successfully"}
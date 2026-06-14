from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.hierarchy import Plants

router = APIRouter()

class SiteCreate(BaseModel):
    company_id: int
    name: str
    code: str
    location: Optional[str] = None

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None

class SiteResponse(SiteCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/")
async def get_sites(company_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Plants)
    if company_id:
        query = query.where(Plants.company_id == company_id)
    result = await db.execute(query)
    sites = result.scalars().all()
    return {"items": sites, "total": len(sites)}

@router.get("/{site_id}")
async def get_site(site_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plants).where(Plants.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site

@router.post("/")
async def create_site(site: SiteCreate, db: AsyncSession = Depends(get_db)):
    new_site = Plants(
        company_id=site.company_id,
        name=site.name,
        code=site.code,
        operational_status="active"
    )
    db.add(new_site)
    await db.commit()
    await db.refresh(new_site)
    return new_site

@router.put("/{site_id}")
async def update_site(
    site_id: int, 
    site: SiteUpdate, 
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Plants).where(Plants.id == site_id))
    existing = result.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Site not found")
    
    if site.name is not None:
        existing.name = site.name
    if site.code is not None:
        existing.code = site.code
    if site.location is not None:
        existing.location = site.location
    
    await db.commit()
    await db.refresh(existing)
    return existing

@router.delete("/{site_id}")
async def delete_site(
    site_id: int, 
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Plants).where(Plants.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    await db.delete(site)
    await db.commit()
    return {"message": "Site deleted successfully"}

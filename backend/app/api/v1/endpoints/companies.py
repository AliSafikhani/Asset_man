from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.hierarchy import Companies

router = APIRouter()

class CompanyCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class CompanyResponse(CompanyCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/")
async def get_companies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Companies))
    companies = result.scalars().all()
    return {"items": companies, "total": len(companies)}

@router.get("/{company_id}")
async def get_company(company_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Companies).where(Companies.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.post("/")
async def create_company(
    company: CompanyCreate, 
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Check if code exists
    existing = await db.execute(select(Companies).where(Companies.code == company.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Company code already exists")
    
    new_company = Companies(
        name=company.name,
        code=company.code,
        address=company.address,
        phone=company.phone,
        email=company.email,
        status="active"
    )
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)
    return new_company

@router.put("/{company_id}")
async def update_company(
    company_id: int,
    company: CompanyUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Companies).where(Companies.id == company_id))
    existing = result.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company.name is not None:
        existing.name = company.name
    if company.code is not None:
        existing.code = company.code
    if company.address is not None:
        existing.address = company.address
    if company.phone is not None:
        existing.phone = company.phone
    if company.email is not None:
        existing.email = company.email
    
    await db.commit()
    await db.refresh(existing)
    return existing

@router.delete("/{company_id}")
async def delete_company(
    company_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Companies).where(Companies.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    await db.delete(company)
    await db.commit()
    return {"message": "Company deleted successfully"}

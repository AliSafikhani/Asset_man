from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/alarms", tags=["Alarm Rules"])

class AlarmRuleCreate(BaseModel):
    signal_mapping_id: int
    alarm_level: int = Field(..., ge=1, le=5)
    condition_type: str = Field(..., pattern="^(above|below|between|rate_of_change)$")
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    severity: str = Field(..., pattern="^(critical|high|warning|advisory|info)$")
    message: Optional[str] = None

class AlarmRuleResponse(AlarmRuleCreate):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=AlarmRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_alarm_rule(
    rule: AlarmRuleCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    from app.models.dcs_mappings import DCSMapping
    from app.models.alarm_rules import AlarmRuleEnhanced
    
    # Verify signal mapping exists
    mapping_result = await db.execute(
        select(DCSMapping).where(DCSMapping.id == rule.signal_mapping_id)
    )
    if not mapping_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Signal mapping not found")
    
    new_rule = AlarmRuleEnhanced(**rule.dict())
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    
    return new_rule

@router.get("/signal/{signal_mapping_id}", response_model=List[AlarmRuleResponse])
async def get_signal_alarms(
    signal_mapping_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    from app.models.alarm_rules import AlarmRuleEnhanced
    
    result = await db.execute(
        select(AlarmRuleEnhanced).where(
            AlarmRuleEnhanced.signal_mapping_id == signal_mapping_id,
            AlarmRuleEnhanced.is_active == True
        ).order_by(AlarmRuleEnhanced.alarm_level)
    )
    rules = result.scalars().all()
    return rules

@router.delete("/{rule_id}")
async def delete_alarm_rule(
    rule_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    from app.models.alarm_rules import AlarmRuleEnhanced
    
    result = await db.execute(select(AlarmRuleEnhanced).where(AlarmRuleEnhanced.id == rule_id))
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Alarm rule not found")
    
    await db.delete(rule)
    await db.commit()
    
    return {"message": "Alarm rule deleted successfully"}

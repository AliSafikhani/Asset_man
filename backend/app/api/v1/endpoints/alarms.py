from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.alarm_event_models import AlarmRule
from app.models.assets import Assets

router = APIRouter()

class AlarmRuleCreate(BaseModel):
    name: str
    asset_id: int
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    unit: Optional[str] = None
    severity: str
    delay_seconds: int = 0
    message: Optional[str] = None
    is_active: bool = True

@router.post("/rules")
async def create_alarm_rule(
    rule: AlarmRuleCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Verify asset exists
    result = await db.execute(select(Assets).where(Assets.id == rule.asset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    new_rule = AlarmRule(
        name=rule.name,
        asset_id=rule.asset_id,
        threshold_min=rule.threshold_min,
        threshold_max=rule.threshold_max,
        unit=rule.unit,
        severity=rule.severity,
        delay_seconds=rule.delay_seconds,
        message=rule.message,
        is_active=rule.is_active,
        created_by=user_id
    )
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    
    return {"id": new_rule.id, "name": new_rule.name, "severity": new_rule.severity}

@router.get("/rules")
async def get_alarm_rules(
    asset_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(AlarmRule)
    if asset_id:
        query = query.where(AlarmRule.asset_id == asset_id)
    result = await db.execute(query)
    rules = result.scalars().all()
    return rules

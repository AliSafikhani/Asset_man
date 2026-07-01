from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.alarm_minimal import AlarmRule

router = APIRouter()

class SimpleAlarmRule(BaseModel):
    name: str
    asset_id: int
    severity: str

@router.post("/test-rule")
async def test_create_rule(
    rule: SimpleAlarmRule,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    new_rule = AlarmRule(
        name=rule.name,
        asset_id=rule.asset_id,
        severity=rule.severity
    )
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    return {"id": new_rule.id, "message": "Rule created"}

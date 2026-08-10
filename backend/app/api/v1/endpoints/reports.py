"""
Reports API
File: backend/app/api/v1/endpoints/reports.py

Aggregator endpoint for the transformer *asset report* (PDF). The frontend does
one GET, picks which modules it wants, and renders the returned JSON straight
into the printable pages.

Mounted in app/api/v1/api.py with prefix="/reports":
  GET /api/v1/reports/transformer/{asset_id}?modules=dga,iec62874,rul
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_dcs_db
from app.services.report_service import ReportService

router = APIRouter(tags=["Reports"])

# The modules a transformer report can currently include.
VALID_MODULES = {"dga", "iec62874", "rul"}


@router.get("/transformer/{asset_id}")
async def get_transformer_report(
    asset_id: int,
    modules: Optional[str] = Query(
        default="dga,iec62874,rul",
        description="Comma-separated modules to include: dga, iec62874, rul.",
    ),
    db: AsyncSession = Depends(get_db),
    dcs_db: AsyncSession = Depends(get_dcs_db),
):
    """
    Build the transformer asset-report payload in one call.

    Returns an envelope with a `cover` block always, plus one block per
    requested (and valid) module. Unknown module names are ignored.
    """
    requested = [m.strip().lower() for m in (modules or "").split(",") if m.strip()]
    selected = [m for m in requested if m in VALID_MODULES]

    service = ReportService()
    report = await service.build_transformer_report(db, dcs_db, asset_id, selected)

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Transformer not found (asset missing or not a transformer).",
        )

    return {
        "asset_id": asset_id,
        "status": "success",
        "modules": selected,
        "data": report,
    }

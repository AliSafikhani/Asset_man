# backend/app/api/v1/endpoints/oil_originality.py
# CRUD + analysis endpoints for the oil-originality (اصالت روغن) module.
# Mounted at /api/v1/oil-originality. A record belongs to a plant; creating one
# runs the DSC+DTA engine on the submitted sample curves and stores the verdict.

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, text
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import io

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.oil_originality import OilOriginalityRecord
from app.models.hierarchy import Plants

from algorithms.transformer.oil_originality import analyze

router = APIRouter()


# ============================================
# PYDANTIC MODELS
# ============================================

class CurveIn(BaseModel):
    temperature: List[float]
    signal: List[float]


class OilOriginalityCreate(BaseModel):
    custom_name: str
    sample_date: Optional[str] = None   # "YYYY-MM-DD" or ISO
    dsc: CurveIn                         # DSC sample curve
    dta: CurveIn                         # DTA sample curve
    dsc_reference: Optional[CurveIn] = None   # DSC reference; None -> built-in
    dta_reference: Optional[CurveIn] = None   # DTA reference; None -> built-in
    notes: Optional[str] = None


class OilOriginalityUpdate(BaseModel):
    custom_name: Optional[str] = None
    sample_date: Optional[str] = None
    notes: Optional[str] = None


# ============================================
# HELPERS
# ============================================

def parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        if '+' in dt_str or dt_str.endswith('Z'):
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        return datetime.fromisoformat(dt_str)
    except ValueError:
        try:
            return datetime.strptime(dt_str, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date format: '{dt_str}'")


async def _ensure_plant(plant_id: int, db: AsyncSession):
    result = await db.execute(select(Plants).where(Plants.id == plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


async def _next_record_number(plant_id: int, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.coalesce(func.max(OilOriginalityRecord.record_number), 0))
        .where(OilOriginalityRecord.plant_id == plant_id)
    )
    return int(result.scalar() or 0) + 1


def _list_item(rec: OilOriginalityRecord) -> Dict[str, Any]:
    """Compact shape for the list table (number, date, name, status, actions)."""
    return {
        "id": rec.id,
        "plant_id": rec.plant_id,
        "record_number": rec.record_number,
        "custom_name": rec.custom_name,
        "sample_date": rec.sample_date,
        "final_status": rec.final_status,
        "total_score": rec.total_score,
        "dsc_status": rec.dsc_status,
        "dta_status": rec.dta_status,
        "created_at": rec.created_at,
    }


def _detail(rec: OilOriginalityRecord) -> Dict[str, Any]:
    """Full shape for the detail page (verdict + features + curves)."""
    return {
        **_list_item(rec),
        "dsc_details": rec.dsc_details or {},
        "dta_details": rec.dta_details or {},
        "input_data": rec.input_data or {},
        "result_data": rec.result_data or {},
        "notes": rec.notes,
        "created_by": rec.created_by,
        "updated_at": rec.updated_at,
    }


# ============================================
# ENDPOINTS
# ============================================

@router.get("/")
async def list_records(
    plant_id: int,
    limit: int = 200,
    skip: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List oil-originality records for a plant (newest first)."""
    query = (
        select(OilOriginalityRecord)
        .where(OilOriginalityRecord.plant_id == plant_id)
        .order_by(desc(OilOriginalityRecord.record_number))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    records = result.scalars().all()
    return {"items": [_list_item(r) for r in records], "total": len(records)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_record(
    payload: OilOriginalityCreate,
    plant_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Run the DSC+DTA analysis on the submitted curves and store the result."""
    await _ensure_plant(plant_id, db)

    dsc_sample = {"temperature": payload.dsc.temperature, "signal": payload.dsc.signal}
    dta_sample = {"temperature": payload.dta.temperature, "signal": payload.dta.signal}
    dsc_reference = (
        {"temperature": payload.dsc_reference.temperature, "signal": payload.dsc_reference.signal}
        if payload.dsc_reference is not None else None
    )
    dta_reference = (
        {"temperature": payload.dta_reference.temperature, "signal": payload.dta_reference.signal}
        if payload.dta_reference is not None else None
    )

    try:
        result = analyze(dsc_sample, dta_sample, dsc_reference, dta_reference)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    record = OilOriginalityRecord(
        plant_id=plant_id,
        record_number=await _next_record_number(plant_id, db),
        custom_name=payload.custom_name,
        sample_date=parse_datetime(payload.sample_date),
        final_status=result["final_status"],
        total_score=result["total_score"],
        dsc_status=result["dsc_status"],
        dta_status=result["dta_status"],
        dsc_details=result["dsc_details"],
        dta_details=result["dta_details"],
        input_data={
            "dsc": dsc_sample,
            "dta": dta_sample,
            # The actual references used (submitted curves, or the built-in ones
            # resolved by the engine when the caller left them blank).
            "dsc_reference": result["curves"]["dsc"]["reference"],
            "dta_reference": result["curves"]["dta"]["reference"],
            "dsc_reference_source": "custom" if dsc_reference is not None else "builtin",
            "dta_reference_source": "custom" if dta_reference is not None else "builtin",
        },
        result_data={
            "dsc": result["dsc"],
            "dta": result["dta"],
            "curves": result["curves"],
        },
        notes=payload.notes,
        created_by=user_id,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _detail(record)


@router.get("/{record_id}")
async def get_record(record_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OilOriginalityRecord).where(OilOriginalityRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Oil-originality record not found")
    return _detail(record)


@router.put("/{record_id}")
async def update_record(
    record_id: int,
    payload: OilOriginalityUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update editable metadata (name/date/notes). Curves are immutable."""
    result = await db.execute(
        select(OilOriginalityRecord).where(OilOriginalityRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Oil-originality record not found")

    update_dict = payload.dict(exclude_unset=True)
    if "sample_date" in update_dict:
        update_dict["sample_date"] = parse_datetime(update_dict["sample_date"])

    for key, value in update_dict.items():
        setattr(record, key, value)

    await db.commit()
    await db.refresh(record)
    return _detail(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OilOriginalityRecord).where(OilOriginalityRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Oil-originality record not found")
    await db.delete(record)
    await db.commit()
    return None


@router.post("/parse-excel")
async def parse_excel(file: UploadFile = File(...)):
    """Parse an uploaded workbook or text file into the four oil-originality curves.

    Accepts Excel (.xlsx / .xls) and delimited text (.txt / .csv / .tsv; the
    delimiter — tab, comma, semicolon or whitespace — is detected automatically).

    Each method needs a reference and a sample curve, and every curve is a pair
    of columns (X = temperature, Y = signal) -> eight separate columns in total,
    matching the eight paste boxes one-for-one:

      DSC sample x / DSC sample y
      DTA sample x / DTA sample y
      DSC reference x / DSC reference y
      DTA reference x / DTA reference y

    Column headers are matched leniently: case, spaces, dashes and underscores
    are ignored, so "DSC Reference - X", "dsc_reference_x" and "dscRefX" are all
    the same column. Shorthand aliases (temp/signal, ref, x/y) are also accepted.

    The two sample curves are required; the two reference curves are optional
    (omit them to use the built-in verified references). Each curve drops rows
    where its own pair is blank.
    """
    if not file.filename.lower().endswith((".xlsx", ".xls", ".txt", ".csv", ".tsv")):
        raise HTTPException(
            status_code=400,
            detail="File must be Excel (.xlsx / .xls) or delimited text (.txt / .csv / .tsv)",
        )

    import re
    import pandas as pd

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    name = file.filename.lower()
    try:
        if name.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            # Delimited text (.txt / .csv / .tsv). Sniff the delimiter first
            # (tab, comma, semicolon...); if that yields a single column, the
            # file is whitespace-separated, so fall back to that.
            df = pd.read_csv(io.BytesIO(content), sep=None, engine="python")
            if df.shape[1] < 2:
                df = pd.read_csv(io.BytesIO(content), sep=r"\s+", engine="python")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    # Normalise headers: lowercase and strip everything that isn't a letter or
    # digit, so "DSC Reference - X" -> "dscreferencex".
    def norm(name):
        return re.sub(r"[^a-z0-9]", "", str(name).lower())

    cols = {norm(c): c for c in df.columns}

    def pick(*aliases):
        for a in aliases:
            if a in cols:
                return cols[a]
        return None

    # Sample curves (required)
    dsc_t = pick("dscsamplex", "dscsampletemp", "dsctemp", "dsctemperature", "dscx")
    dsc_s = pick("dscsampley", "dscsamplesignal", "dscsignal", "dscy", "dsc")
    dta_t = pick("dtasamplex", "dtasampletemp", "dtatemp", "dtatemperature", "dtax")
    dta_s = pick("dtasampley", "dtasamplesignal", "dtasignal", "dtay", "dta")

    # Reference curves (optional)
    dsc_rt = pick("dscreferencex", "dscrefx", "dscreferencetemp", "dscreftemp", "dscreftemperature")
    dsc_rs = pick("dscreferencey", "dscrefy", "dscreferencesignal", "dscrefsignal", "dscref")
    dta_rt = pick("dtareferencex", "dtarefx", "dtareferencetemp", "dtareftemp", "dtareftemperature")
    dta_rs = pick("dtareferencey", "dtarefy", "dtareferencesignal", "dtarefsignal", "dtaref")

    def series(tcol, scol):
        if tcol is None or scol is None:
            return None
        temperature, signal = [], []
        for _, row in df.iterrows():
            tv, sv = row[tcol], row[scol]
            if pd.isna(tv) or pd.isna(sv):
                continue
            try:
                temperature.append(float(tv))
                signal.append(float(sv))
            except (ValueError, TypeError):
                continue
        return {"temperature": temperature, "signal": signal}

    dsc = series(dsc_t, dsc_s)
    dta = series(dta_t, dta_s)
    dsc_reference = series(dsc_rt, dsc_rs)
    dta_reference = series(dta_rt, dta_rs)

    if not dsc or not dsc["temperature"] or not dta or not dta["temperature"]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not find the DSC and DTA sample columns. Expected "
                "'DSC sample x'/'DSC sample y' and 'DTA sample x'/'DTA sample y'."
            ),
        )

    return {
        "success": True,
        "filename": file.filename,
        "dsc": dsc,
        "dta": dta,
        # null when the workbook has no reference columns -> caller falls back
        # to the built-in reference for that method.
        "dsc_reference": dsc_reference if dsc_reference and dsc_reference["temperature"] else None,
        "dta_reference": dta_reference if dta_reference and dta_reference["temperature"] else None,
    }

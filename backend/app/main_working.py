from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import engine, Base, get_db
from app.models.assets import Assets
from app.models.hierarchy import Plants

app = FastAPI(title="Asset Management System", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AssetCreate(BaseModel):
    plant_id: int
    asset_type: str
    asset_name: str
    asset_code: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    criticality_level: Optional[str] = "medium"

class AssetResponse(BaseModel):
    id: int
    plant_id: int
    asset_type: str
    asset_name: str
    asset_code: str
    operational_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Startup event
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database ready")


# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/")
async def root():
    return {"message": "Asset Management System API", "version": "1.0.0"}


# Assets endpoints
@app.get("/api/v1/assets", response_model=dict)
async def get_assets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assets))
    assets = result.scalars().all()
    return {"items": assets, "total": len(assets)}


@app.post("/api/v1/assets", response_model=AssetResponse, status_code=201)
async def create_asset(
    asset: AssetCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check if plant exists
    plant_result = await db.execute(select(Plants).where(Plants.id == asset.plant_id))
    if not plant_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Plant with id {asset.plant_id} not found")
    
    # Check if asset code exists
    existing = await db.execute(select(Assets).where(Assets.asset_code == asset.asset_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Asset code {asset.asset_code} already exists")
    
    # Create asset
    new_asset = Assets(
        plant_id=asset.plant_id,
        asset_type=asset.asset_type,
        asset_name=asset.asset_name,
        asset_code=asset.asset_code,
        manufacturer=asset.manufacturer,
        model=asset.model,
        criticality_level=asset.criticality_level,
        operational_status="active"
    )
    
    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)
    
    return new_asset


@app.get("/api/v1/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


# Plants endpoints
@app.get("/api/v1/plants")
async def get_plants(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plants))
    plants = result.scalars().all()
    return {"items": plants, "total": len(plants)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

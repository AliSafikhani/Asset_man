from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database setup - use 127.0.0.1 instead of localhost
DATABASE_URL = f"postgresql+asyncpg://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

print(f"Connecting to: {os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

# Model
class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    asset_type = Column(String, nullable=False)
    created_at = Column(String, default=datetime.utcnow().isoformat())

# Pydantic schemas
class AssetCreate(BaseModel):
    name: str
    code: str
    asset_type: str

class AssetResponse(BaseModel):
    id: int
    name: str
    code: str
    asset_type: str
    created_at: str

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# Endpoints
@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created")

@app.get("/")
async def root():
    return {"message": "Asset Management System", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/assets", response_model=AssetResponse)
async def create_asset(asset: AssetCreate, db: AsyncSession = Depends(get_db)):
    new_asset = Asset(name=asset.name, code=asset.code, asset_type=asset.asset_type)
    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)
    return new_asset

@app.get("/assets", response_model=List[AssetResponse])
async def get_assets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset))
    assets = result.scalars().all()
    return assets

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

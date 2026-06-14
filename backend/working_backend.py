from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# CORS - Must be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class AssetCreate(BaseModel):
    plant_id: int
    asset_type: str
    asset_name: str
    asset_code: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None

# Test endpoint
@app.get("/api/v1/test")
async def test():
    return {"message": "Backend is working!", "status": "ok"}

# Health endpoint
@app.get("/api/v1/health")
async def health():
    return {"status": "healthy", "service": "Asset Management"}

# Create asset endpoint
@app.post("/api/v1/assets")
async def create_asset(asset: AssetCreate):
    return {
        "id": 1,
        "message": "Asset created successfully",
        "asset": asset.dict()
    }

# Get assets endpoint
@app.get("/api/v1/assets")
async def get_assets():
    return {"items": [], "total": 0}

print("✅ Server started with CORS enabled")

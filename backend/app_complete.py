from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Asset Management System", version="1.0.0")

# CORS - Explicit configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Type"],
)

# Database connection
def get_db():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', '127.0.0.1'),
        port=os.getenv('POSTGRES_PORT', 5432),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'sekert1!'),
        database=os.getenv('POSTGRES_DB', 'webapp_db')
    )

# Pydantic Models
class AssetCreate(BaseModel):
    plant_id: int
    asset_type: str
    asset_name: str
    asset_code: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    criticality_level: Optional[str] = "medium"

# Health Check
@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/")
async def root():
    return {"message": "Asset Management System", "version": "1.0.0"}

# Assets endpoints
@app.get("/api/v1/assets")
async def get_assets():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM assets ORDER BY id DESC")
    assets = cur.fetchall()
    cur.close()
    conn.close()
    return {"items": assets, "total": len(assets)}

@app.options("/api/v1/assets")
async def options_assets():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.post("/api/v1/assets", status_code=201)
async def create_asset(asset: AssetCreate):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if asset code exists
    cur.execute("SELECT id FROM assets WHERE asset_code = %s", (asset.asset_code,))
    if cur.fetchone():
        raise HTTPException(status_code=400, detail="Asset code already exists")
    
    # Insert asset
    cur.execute("""
        INSERT INTO assets (plant_id, asset_type, asset_name, asset_code, manufacturer, model, criticality_level, operational_status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'active')
        RETURNING *
    """, (asset.plant_id, asset.asset_type, asset.asset_name, asset.asset_code, asset.manufacturer, asset.model, asset.criticality_level))
    
    new_asset = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return new_asset

print("✅ Asset Management API Server Started")
print("📍 http://localhost:8000")
print("📚 http://localhost:8000/docs")

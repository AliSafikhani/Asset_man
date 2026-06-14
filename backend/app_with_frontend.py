from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import os.path

load_dotenv()

app = FastAPI(title="Asset Management System", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

class AssetCreate(BaseModel):
    plant_id: int
    asset_type: str
    asset_name: str
    asset_code: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    criticality_level: Optional[str] = "medium"

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/v1/assets")
async def get_assets():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM assets ORDER BY id DESC")
    assets = cur.fetchall()
    cur.close()
    conn.close()
    return {"items": assets, "total": len(assets)}

@app.post("/api/v1/assets", status_code=201)
async def create_asset(asset: AssetCreate):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT id FROM assets WHERE asset_code = %s", (asset.asset_code,))
    if cur.fetchone():
        raise HTTPException(status_code=400, detail="Asset code already exists")
    
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

# Serve React frontend - check if dist exists
frontend_dist_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")
    
    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
    
    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
    print(f"✅ Serving frontend from {frontend_dist_path}")
else:
    print(f"⚠️ Frontend not found at {frontend_dist_path}")
    print("   Run 'npm run build' in the frontend directory first")

print("✅ Server running at http://localhost:8000")

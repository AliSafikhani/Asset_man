from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', '127.0.0.1'),
        port=os.getenv('POSTGRES_PORT', 5432),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'sekert1!'),
        database=os.getenv('POSTGRES_DB', 'webapp_db')
    )

# Create tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS assets (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(100) UNIQUE NOT NULL,
            asset_type VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized")

# Pydantic models
class AssetCreate(BaseModel):
    name: str
    code: str
    asset_type: str

class AssetResponse(BaseModel):
    id: int
    name: str
    code: str
    asset_type: str
    created_at: datetime

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
async def root():
    return {"message": "Asset Management System", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/assets", response_model=AssetResponse)
async def create_asset(asset: AssetCreate):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        "INSERT INTO assets (name, code, asset_type) VALUES (%s, %s, %s) RETURNING *",
        (asset.name, asset.code, asset.asset_type)
    )
    new_asset = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return new_asset

@app.get("/assets", response_model=List[AssetResponse])
async def get_assets():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM assets ORDER BY id DESC")
    assets = cur.fetchall()
    cur.close()
    conn.close()
    return assets

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

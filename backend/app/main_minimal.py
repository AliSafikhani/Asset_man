from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI()

# CORS - Must be FIRST before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/v1/assets")
async def get_assets():
    return {"items": [], "total": 0}

@app.post("/api/v1/assets")
async def create_asset(
    plant_id: int,
    asset_type: str,
    asset_name: str,
    asset_code: str
):
    return {
        "id": 1,
        "plant_id": plant_id,
        "asset_type": asset_type,
        "asset_name": asset_name,
        "asset_code": asset_code,
        "operational_status": "active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

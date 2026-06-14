from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API endpoints
@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Backend is running"}

@app.get("/api/v1/assets")
async def get_assets():
    return {"items": [], "total": 0}

# Serve static files from frontend/dist
dist_path = os.path.join(os.path.dirname(__file__), "frontend", "dist")
print(f"Serving static files from: {dist_path}")

# Mount the assets folder
assets_path = os.path.join(dist_path, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

# Serve index.html for root and all other routes
@app.get("/")
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str = ""):
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not found"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Server starting at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)

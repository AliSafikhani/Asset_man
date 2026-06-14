from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API endpoint to test
@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Serve React frontend
if os.path.exists("frontend/dist/index.html"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
    
    @app.get("/")
    async def serve_frontend():
        return FileResponse("frontend/dist/index.html")
    
    print("✅ Serving frontend at http://localhost:8000")
else:
    print("⚠️ Frontend not built. Run: cd frontend && npm run build")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

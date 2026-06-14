"""
Simple working FastAPI application
"""

from fastapi import FastAPI

app = FastAPI(
    title="Simple Test API",
    description="Testing FastAPI setup",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {
        "message": "Hello World!",
        "status": "running",
        "server": "FastAPI is working!"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.get("/test")
async def test():
    return {"message": "Test endpoint is working"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
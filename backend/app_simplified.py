"""
Simplified version of the main application
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import asyncio

app = FastAPI(
    title="High-Performance WebSocket App",
    description="Real-time data streaming with 1 kHz support",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "High-Performance WebSocket App",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "websocket": "ws://localhost:8000/ws"
        }
    }

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"WebSocket connected: {websocket.client}")
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connection_established",
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Connected to WebSocket server"
        })
        
        # Keep connection alive and echo messages
        while True:
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
            else:
                await websocket.send_json({
                    "type": "echo",
                    "data": data,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {websocket.client}")

# Real-time data simulation endpoint
@app.get("/api/realtime/data")
async def get_realtime_data():
    """Simulate real-time data point"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "value": 100 + (datetime.utcnow().timestamp() % 100) / 10,
        "unit": "°C",
        "sensor_id": "sensor_1"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
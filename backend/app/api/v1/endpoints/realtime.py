"""
Real-time data endpoints - Simplified version
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import Optional
from datetime import datetime
import logging

from app.core.security import get_current_user_id

router = APIRouter(prefix="/realtime", tags=["Real-time"])
logger = logging.getLogger(__name__)


@router.get("/streams")
async def get_available_streams():
    """Get list of available data streams"""
    return {
        "streams": [
            {"id": "sensor_1", "name": "Temperature Sensor", "unit": "°C"},
            {"id": "sensor_2", "name": "Pressure Sensor", "unit": "kPa"},
            {"id": "vibration", "name": "Vibration Monitor", "unit": "mm/s"},
            {"id": "current", "name": "Current Sensor", "unit": "A"},
        ]
    }


@router.get("/stats")
async def get_realtime_stats():
    """Get real-time system statistics"""
    return {
        "connections": {
            "total_connections": 0,
            "active_streams": 4,
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.websocket("/ws/{stream_id}")
async def websocket_stream(
    websocket: WebSocket,
    stream_id: str
):
    """WebSocket endpoint for real-time data streaming"""
    await websocket.accept()
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "stream_id": stream_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive and send periodic data
        import asyncio
        counter = 0
        
        while True:
            # Receive client messages
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                # Echo back for testing
                await websocket.send_json({
                    "type": "echo",
                    "data": data,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            counter += 1
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for stream {stream_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
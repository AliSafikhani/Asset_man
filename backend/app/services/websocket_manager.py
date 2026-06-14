"""
WebSocket Connection Manager for handling 100+ concurrent connections
Manages active connections, subscriptions, and message broadcasting
"""

import asyncio
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time data streaming
    Handles connection lifecycle, subscriptions, and broadcasting
    """
    
    def __init__(self):
        # Active connections: WebSocket -> connection metadata
        self.active_connections: Dict[WebSocket, dict] = {}
        
        # User subscriptions: stream_id -> set of websockets
        self.subscriptions: Dict[str, Set[WebSocket]] = {}
        
        # Rate limiting: websocket -> message count per minute
        self.message_counts: Dict[WebSocket, int] = {}
        
        # Connection limits
        self.max_connections = 500
        self.max_messages_per_minute = 1000
        
        # Lock for thread-safe operations
        self._lock = asyncio.Lock()
        
    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None):
        """
        Accept and register a new WebSocket connection
        
        Args:
            websocket: WebSocket connection
            user_id: Optional user ID for authenticated connections
        """
        async with self._lock:
            # Check connection limits
            if len(self.active_connections) >= self.max_connections:
                await websocket.close(code=1008, reason="Server at maximum capacity")
                return None
            
            # Accept the connection
            await websocket.accept()
            
            # Store connection metadata
            self.active_connections[websocket] = {
                "connected_at": datetime.utcnow(),
                "user_id": user_id,
                "subscriptions": set(),
                "last_activity": datetime.utcnow(),
                "message_count": 0
            }
            
            # Initialize message count for rate limiting
            self.message_counts[websocket] = 0
            
            logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
            
            # Send welcome message
            await websocket.send_json({
                "type": "connection_established",
                "connection_id": id(websocket),
                "timestamp": datetime.utcnow().isoformat(),
                "active_connections": len(self.active_connections)
            })
            
            return websocket
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            # Remove from all subscriptions
            subscriptions = self.active_connections[websocket].get("subscriptions", set())
            for stream_id in subscriptions:
                if stream_id in self.subscriptions:
                    self.subscriptions[stream_id].discard(websocket)
            
            # Remove from active connections
            del self.active_connections[websocket]
            
            # Clean up rate limiting
            if websocket in self.message_counts:
                del self.message_counts[websocket]
            
            logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")
    
    async def subscribe(self, websocket: WebSocket, stream_id: str):
        """
        Subscribe a connection to a specific data stream
        
        Args:
            websocket: WebSocket connection
            stream_id: Stream identifier (e.g., "sensor_1", "all")
        """
        async with self._lock:
            # Create subscription set if doesn't exist
            if stream_id not in self.subscriptions:
                self.subscriptions[stream_id] = set()
            
            # Add websocket to subscription
            self.subscriptions[stream_id].add(websocket)
            
            # Update connection metadata
            if websocket in self.active_connections:
                self.active_connections[websocket]["subscriptions"].add(stream_id)
                self.active_connections[websocket]["last_activity"] = datetime.utcnow()
            
            logger.debug(f"WebSocket subscribed to {stream_id}")
    
    async def unsubscribe(self, websocket: WebSocket, stream_id: str):
        """
        Unsubscribe a connection from a data stream
        
        Args:
            websocket: WebSocket connection
            stream_id: Stream identifier
        """
        async with self._lock:
            if stream_id in self.subscriptions:
                self.subscriptions[stream_id].discard(websocket)
                
                # Clean up empty subscription sets
                if len(self.subscriptions[stream_id]) == 0:
                    del self.subscriptions[stream_id]
            
            # Update connection metadata
            if websocket in self.active_connections:
                self.active_connections[websocket]["subscriptions"].discard(stream_id)
    
    async def broadcast_to_stream(
        self, 
        stream_id: str, 
        data: Any, 
        exclude: Optional[WebSocket] = None
    ):
        """
        Broadcast data to all subscribers of a stream
        
        Args:
            stream_id: Stream identifier
            data: Data to broadcast
            exclude: Optional connection to exclude
        """
        if stream_id not in self.subscriptions:
            return
        
        # Convert data to JSON string once for efficiency
        if not isinstance(data, str):
            data = json.dumps(data)
        
        # Get all subscribers
        subscribers = self.subscriptions[stream_id].copy()
        
        # Create broadcast tasks
        tasks = []
        for websocket in subscribers:
            if websocket == exclude:
                continue
            
            if websocket in self.active_connections:
                tasks.append(self._safe_send(websocket, data))
        
        # Execute broadcasts concurrently
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def broadcast_to_all(self, data: Any, exclude: Optional[WebSocket] = None):
        """
        Broadcast data to all active connections
        
        Args:
            data: Data to broadcast
            exclude: Optional connection to exclude
        """
        # Convert data to JSON string once
        if not isinstance(data, str):
            data = json.dumps(data)
        
        # Create broadcast tasks for all connections
        tasks = []
        for websocket in self.active_connections.keys():
            if websocket == exclude:
                continue
            tasks.append(self._safe_send(websocket, data))
        
        # Execute broadcasts concurrently
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Log any errors
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Broadcast error: {result}")
    
    async def send_to_user(self, user_id: int, data: Any):
        """
        Send data to all connections of a specific user
        
        Args:
            user_id: User ID
            data: Data to send
        """
        if not isinstance(data, str):
            data = json.dumps(data)
        
        tasks = []
        for websocket, metadata in self.active_connections.items():
            if metadata.get("user_id") == user_id:
                tasks.append(self._safe_send(websocket, data))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _safe_send(self, websocket: WebSocket, message: str):
        """
        Safely send a message to a websocket with error handling
        
        Args:
            websocket: WebSocket connection
            message: Message to send
        """
        try:
            # Rate limiting check
            if websocket in self.message_counts:
                self.message_counts[websocket] += 1
                
                # Reset counter every minute (handled by background task)
                if self.message_counts[websocket] > self.max_messages_per_minute:
                    logger.warning(f"Rate limit exceeded for connection {id(websocket)}")
                    await websocket.send_json({
                        "type": "error",
                        "error": "Rate limit exceeded. Please slow down."
                    })
                    return
            
            await websocket.send_text(message)
            
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            # Remove dead connection
            self.disconnect(websocket)
    
    async def reset_rate_limits(self):
        """Reset rate limiting counters (called every minute)"""
        async with self._lock:
            for websocket in self.message_counts:
                self.message_counts[websocket] = 0
    
    async def get_connection_stats(self) -> dict:
        """
        Get connection statistics
        
        Returns:
            Dictionary with connection statistics
        """
        async with self._lock:
            total_connections = len(self.active_connections)
            authenticated = sum(1 for m in self.active_connections.values() if m.get("user_id"))
            anonymous = total_connections - authenticated
            
            stream_stats = {
                stream_id: len(subscribers) 
                for stream_id, subscribers in self.subscriptions.items()
            }
            
            return {
                "total_connections": total_connections,
                "authenticated_connections": authenticated,
                "anonymous_connections": anonymous,
                "total_streams": len(self.subscriptions),
                "stream_subscribers": stream_stats,
                "max_connections": self.max_connections,
                "connection_utilization": (total_connections / self.max_connections) * 100
            }
    
    async def close_all_connections(self):
        """Close all active connections (used during shutdown)"""
        logger.info(f"Closing {len(self.active_connections)} connections...")
        
        # Send shutdown message to all connections
        shutdown_message = json.dumps({
            "type": "server_shutdown",
            "message": "Server is shutting down. Reconnect in a few seconds.",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        tasks = []
        for websocket in list(self.active_connections.keys()):
            tasks.append(self._safe_send(websocket, shutdown_message))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        # Close all connections
        for websocket in list(self.active_connections.keys()):
            try:
                await websocket.close(code=1001, reason="Server shutdown")
            except Exception as e:
                logger.error(f"Error closing connection: {e}")
            
            self.disconnect(websocket)
        
        logger.info("All connections closed")
    
    def is_connected(self, websocket: WebSocket) -> bool:
        """Check if a websocket is still connected"""
        return websocket in self.active_connections


# Global instance
connection_manager = ConnectionManager()
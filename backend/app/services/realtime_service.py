"""
Real-time data service for handling 1 kHz data streaming
Manages data ingestion, downsampling, and broadcasting to WebSocket clients
"""

import asyncio
import random
import numpy as np
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from collections import deque
import logging

from app.services.websocket_manager import connection_manager
from app.utils.downsampler import RealtimeDownsampler
from app.core.redis import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class RealtimeService:
    """
    Service for managing real-time data at 1 kHz frequency
    Handles data generation, downsampling, and distribution to clients
    """
    
    def __init__(self):
        # Data buffers for each stream
        self.data_buffers: Dict[str, deque] = {}
        
        # Downsamplers for each stream
        self.downsamplers: Dict[str, RealtimeDownsampler] = {}
        
        # Stream configuration
        self.streams: Dict[str, dict] = {}
        
        # Active data sources
        self.data_sources: Dict[str, Callable] = {}
        
        # Background tasks
        self.broadcast_task: Optional[asyncio.Task] = None
        self.ingestion_task: Optional[asyncio.Task] = None
        
        # Control flags
        self.is_running = False
        
        # Default stream configurations
        self.default_streams = {
            "sensor_1": {
                "frequency_hz": 1000,
                "downsample_factor": settings.REALTIME_DOWNSAMPLE_FACTOR,
                "data_type": "float",
                "unit": "°C",
                "range": (-10, 100)
            },
            "sensor_2": {
                "frequency_hz": 1000,
                "downsample_factor": settings.REALTIME_DOWNSAMPLE_FACTOR,
                "data_type": "float",
                "unit": "kPa",
                "range": (80, 120)
            },
            "vibration": {
                "frequency_hz": 1000,
                "downsample_factor": settings.REALTIME_DOWNSAMPLE_FACTOR,
                "data_type": "vector",
                "unit": "mm/s",
                "range": (0, 50)
            },
            "current": {
                "frequency_hz": 1000,
                "downsample_factor": settings.REALTIME_DOWNSAMPLE_FACTOR,
                "data_type": "float",
                "unit": "A",
                "range": (0, 100)
            }
        }
        
        # Initialize default streams
        for stream_id, config in self.default_streams.items():
            self.register_stream(stream_id, config)
    
    def register_stream(self, stream_id: str, config: dict):
        """
        Register a new data stream
        
        Args:
            stream_id: Unique stream identifier
            config: Stream configuration (frequency, data type, etc.)
        """
        self.streams[stream_id] = {
            **config,
            "created_at": datetime.utcnow(),
            "total_points": 0,
            "last_broadcast": None
        }
        
        # Initialize buffer for this stream
        buffer_size = config.get("frequency_hz", 1000) * 2  # 2 seconds buffer
        self.data_buffers[stream_id] = deque(maxlen=buffer_size)
        
        # Initialize downsampler
        self.downsamplers[stream_id] = RealtimeDownsampler(
            target_freq=config.get("frequency_hz", 1000) / config.get("downsample_factor", 33)
        )
        
        logger.info(f"Registered stream: {stream_id} with config: {config}")
    
    async def start(self):
        """Start the real-time data service"""
        if self.is_running:
            logger.warning("Realtime service is already running")
            return
        
        self.is_running = True
        
        # Start background tasks
        self.broadcast_task = asyncio.create_task(self._broadcast_loop())
        self.ingestion_task = asyncio.create_task(self._ingest_data_loop())
        
        logger.info("Realtime service started")
    
    async def stop(self):
        """Stop the real-time data service"""
        self.is_running = False
        
        # Cancel background tasks
        if self.broadcast_task:
            self.broadcast_task.cancel()
        if self.ingestion_task:
            self.ingestion_task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(
            self.broadcast_task, 
            self.ingestion_task, 
            return_exceptions=True
        )
        
        logger.info("Realtime service stopped")
    
    async def _ingest_data_loop(self):
        """
        Background task that ingests data at 1 kHz frequency
        This simulates data from sensors or reads from message queue
        """
        logger.info("Data ingestion loop started")
        
        # Track last timestamps for each stream
        last_timestamps = {stream_id: datetime.utcnow() for stream_id in self.streams}
        
        while self.is_running:
            try:
                current_time = datetime.utcnow()
                
                # Process each stream at its configured frequency
                for stream_id, stream_config in self.streams.items():
                    frequency_hz = stream_config.get("frequency_hz", 1000)
                    interval_ms = 1000 / frequency_hz  # Convert to milliseconds
                    
                    # Check if it's time to generate data for this stream
                    time_diff = (current_time - last_timestamps[stream_id]).total_seconds() * 1000
                    
                    if time_diff >= interval_ms:
                        # Generate data point
                        data_point = await self._generate_data_point(stream_id)
                        
                        # Store in buffer
                        self.data_buffers[stream_id].append({
                            "timestamp": current_time.isoformat(),
                            "value": data_point,
                            "stream_id": stream_id
                        })
                        
                        # Update stream stats
                        self.streams[stream_id]["total_points"] += 1
                        last_timestamps[stream_id] = current_time
                        
                        # Store in Redis for persistence (optional, for historical data)
                        if random.random() < 0.1:  # Store 10% of points
                            await redis_client.lpush(
                                f"realtime:history:{stream_id}",
                                {
                                    "timestamp": current_time.isoformat(),
                                    "value": data_point
                                }
                            )
                            # Trim to last 10000 points
                            await redis_client.ltrim(f"realtime:history:{stream_id}", 0, 9999)
                
                # Small sleep to prevent CPU overuse
                await asyncio.sleep(0.0001)  # 0.1ms sleep
                
            except Exception as e:
                logger.error(f"Error in data ingestion loop: {e}")
                await asyncio.sleep(0.01)
    
    async def _generate_data_point(self, stream_id: str) -> Any:
        """
        Generate a synthetic data point for a stream
        
        Args:
            stream_id: Stream identifier
        
        Returns:
            Generated data point (float, vector, etc.)
        """
        config = self.streams.get(stream_id, {})
        data_type = config.get("data_type", "float")
        value_range = config.get("range", (0, 100))
        
        if data_type == "float":
            # Generate sine wave with noise for realistic data
            import math
            timestamp = datetime.utcnow().timestamp()
            
            # Base sine wave
            amplitude = (value_range[1] - value_range[0]) / 2
            midpoint = (value_range[1] + value_range[0]) / 2
            sine_value = midpoint + amplitude * math.sin(timestamp * 2 * math.pi / 10)  # 10s period
            
            # Add random noise
            noise = random.uniform(-amplitude * 0.1, amplitude * 0.1)
            
            return round(sine_value + noise, 2)
            
        elif data_type == "vector":
            # Generate 3D vector (x, y, z)
            return [
                round(random.uniform(value_range[0], value_range[1]), 2),
                round(random.uniform(value_range[0], value_range[1]), 2),
                round(random.uniform(value_range[0], value_range[1]), 2)
            ]
        else:
            return random.uniform(value_range[0], value_range[1])
    
    async def _broadcast_loop(self):
        """
        Background task that broadcasts downsampled data to clients
        Runs at ~30 Hz (downsampled from 1 kHz)
        """
        logger.info("Broadcast loop started")
        
        # Track last broadcast times for each stream
        last_broadcast = {stream_id: datetime.utcnow() for stream_id in self.streams}
        
        while self.is_running:
            try:
                current_time = datetime.utcnow()
                
                # Process each stream
                for stream_id, stream_config in self.streams.items():
                    # Calculate target broadcast frequency (downsampled)
                    original_freq = stream_config.get("frequency_hz", 1000)
                    downsample_factor = stream_config.get("downsample_factor", 33)
                    target_freq = original_freq / downsample_factor
                    interval_ms = 1000 / target_freq
                    
                    # Check if it's time to broadcast
                    time_diff = (current_time - last_broadcast[stream_id]).total_seconds() * 1000
                    
                    if time_diff >= interval_ms and stream_id in self.data_buffers:
                        # Get downsampled data from buffer
                        downsampler = self.downsamplers.get(stream_id)
                        if downsampler:
                            # Get recent points from buffer
                            recent_points = list(self.data_buffers[stream_id])
                            
                            if recent_points:
                                # Downsample the data
                                downsampled = downsampler.downsample(recent_points)
                                
                                # Prepare broadcast message
                                message = {
                                    "type": "realtime_data",
                                    "stream_id": stream_id,
                                    "timestamp": current_time.isoformat(),
                                    "data": downsampled,
                                    "metadata": {
                                        "original_frequency": original_freq,
                                        "downsampled_frequency": target_freq,
                                        "points_in_window": len(recent_points),
                                        "unit": stream_config.get("unit", "unknown")
                                    }
                                }
                                
                                # Broadcast to subscribers of this stream
                                await connection_manager.broadcast_to_stream(stream_id, message)
                                
                                last_broadcast[stream_id] = current_time
                
                # Small sleep to maintain ~30 Hz broadcast rate
                await asyncio.sleep(0.033)  # 33ms = ~30 Hz
                
            except Exception as e:
                logger.error(f"Error in broadcast loop: {e}")
                await asyncio.sleep(0.033)
    
    async def inject_data_point(self, stream_id: str, value: Any):
        """
        Inject an external data point into the stream (e.g., from MQTT, Kafka)
        
        Args:
            stream_id: Stream identifier
            value: Data value to inject
        """
        if stream_id not in self.data_buffers:
            logger.warning(f"Stream {stream_id} not found")
            return
        
        data_point = {
            "timestamp": datetime.utcnow().isoformat(),
            "value": value,
            "stream_id": stream_id
        }
        
        self.data_buffers[stream_id].append(data_point)
        
        # Update stream stats
        if stream_id in self.streams:
            self.streams[stream_id]["total_points"] += 1
    
    async def get_stream_stats(self, stream_id: str) -> dict:
        """
        Get statistics for a specific stream
        
        Args:
            stream_id: Stream identifier
        
        Returns:
            Dictionary with stream statistics
        """
        if stream_id not in self.streams:
            return {}
        
        config = self.streams[stream_id]
        buffer = self.data_buffers.get(stream_id, deque())
        
        return {
            "stream_id": stream_id,
            "config": config,
            "buffer_size": len(buffer),
            "total_points": config.get("total_points", 0),
            "subscribers": len(connection_manager.subscriptions.get(stream_id, set())),
            "last_broadcast": config.get("last_broadcast"),
            "created_at": config.get("created_at")
        }
    
    async def get_all_streams_stats(self) -> dict:
        """
        Get statistics for all streams
        
        Returns:
            Dictionary with all stream statistics
        """
        stats = {}
        for stream_id in self.streams:
            stats[stream_id] = await self.get_stream_stats(stream_id)
        
        return stats


# Global instance
realtime_service = RealtimeService()
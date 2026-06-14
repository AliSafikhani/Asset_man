"""
Redis client wrapper for caching, pub/sub, and real-time data storage
"""

import redis.asyncio as redis
import json
from typing import Optional, Any, Dict, List
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """
    Redis client for caching, pub/sub, and real-time operations
    """
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.pubsub: Optional[redis.client.PubSub] = None
        self.is_connected = False
    
    async def connect(self):
        """Establish connection to Redis"""
        try:
            self.client = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50
            )
            
            # Test connection
            await self.client.ping()
            self.is_connected = True
            
            # Initialize pubsub
            self.pubsub = self.client.pubsub()
            
            logger.info("Connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.is_connected = False
            raise
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            self.is_connected = False
            logger.info("Disconnected from Redis")
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """
        Set a key-value pair in Redis
        
        Args:
            key: Redis key
            value: Value to store (will be JSON serialized if not string)
            expire: Expiration time in seconds
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_connected:
            return False
        
        try:
            # Serialize value if not string
            if not isinstance(value, str):
                value = json.dumps(value, default=self._json_serializer)
            
            if expire:
                await self.client.setex(key, expire, value)
            else:
                await self.client.set(key, value)
            
            return True
        except Exception as e:
            logger.error(f"Redis set error for key {key}: {e}")
            return False
    
    async def get(self, key: str, deserialize: bool = True) -> Optional[Any]:
        """
        Get a value from Redis
        
        Args:
            key: Redis key
            deserialize: Whether to deserialize JSON
        
        Returns:
            Value or None if not found
        """
        if not self.is_connected:
            return None
        
        try:
            value = await self.client.get(key)
            if value and deserialize:
                try:
                    return json.loads(value)
                except:
                    return value
            return value
        except Exception as e:
            logger.error(f"Redis get error for key {key}: {e}")
            return None
    
    async def delete(self, *keys: str) -> int:
        """
        Delete one or more keys
        
        Args:
            keys: Keys to delete
        
        Returns:
            Number of deleted keys
        """
        if not self.is_connected:
            return 0
        
        try:
            return await self.client.delete(*keys)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        """
        Check if a key exists
        
        Args:
            key: Redis key
        
        Returns:
            True if key exists
        """
        if not self.is_connected:
            return False
        
        try:
            return await self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return False
    
    async def expire(self, key: str, seconds: int) -> bool:
        """
        Set expiration time for a key
        
        Args:
            key: Redis key
            seconds: Expiration time in seconds
        
        Returns:
            True if successful
        """
        if not self.is_connected:
            return False
        
        try:
            return await self.client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis expire error: {e}")
            return False
    
    async def incr(self, key: str, amount: int = 1) -> int:
        """
        Increment a counter
        
        Args:
            key: Redis key
            amount: Increment amount
        
        Returns:
            New value
        """
        if not self.is_connected:
            return 0
        
        try:
            return await self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Redis incr error: {e}")
            return 0
    
    async def hset(self, key: str, field: str, value: Any) -> bool:
        """
        Set a hash field
        
        Args:
            key: Redis key
            field: Hash field name
            value: Value to store
        
        Returns:
            True if successful
        """
        if not self.is_connected:
            return False
        
        try:
            if not isinstance(value, str):
                value = json.dumps(value, default=self._json_serializer)
            
            await self.client.hset(key, field, value)
            return True
        except Exception as e:
            logger.error(f"Redis hset error: {e}")
            return False
    
    async def hget(self, key: str, field: str, deserialize: bool = True) -> Optional[Any]:
        """
        Get a hash field
        
        Args:
            key: Redis key
            field: Hash field name
            deserialize: Whether to deserialize JSON
        
        Returns:
            Value or None
        """
        if not self.is_connected:
            return None
        
        try:
            value = await self.client.hget(key, field)
            if value and deserialize:
                try:
                    return json.loads(value)
                except:
                    return value
            return value
        except Exception as e:
            logger.error(f"Redis hget error: {e}")
            return None
    
    async def lpush(self, key: str, value: Any) -> int:
        """
        Push value to left of list
        
        Args:
            key: Redis key
            value: Value to push
        
        Returns:
            Length of list after push
        """
        if not self.is_connected:
            return 0
        
        try:
            if not isinstance(value, str):
                value = json.dumps(value, default=self._json_serializer)
            
            return await self.client.lpush(key, value)
        except Exception as e:
            logger.error(f"Redis lpush error: {e}")
            return 0
    
    async def lrange(self, key: str, start: int, end: int, deserialize: bool = True) -> List[Any]:
        """
        Get range of list elements
        
        Args:
            key: Redis key
            start: Start index
            end: End index
            deserialize: Whether to deserialize JSON
        
        Returns:
            List of values
        """
        if not self.is_connected:
            return []
        
        try:
            values = await self.client.lrange(key, start, end)
            if deserialize:
                result = []
                for value in values:
                    try:
                        result.append(json.loads(value))
                    except:
                        result.append(value)
                return result
            return values
        except Exception as e:
            logger.error(f"Redis lrange error: {e}")
            return []
    
    async def ltrim(self, key: str, start: int, end: int) -> bool:
        """
        Trim list to specified range
        
        Args:
            key: Redis key
            start: Start index
            end: End index
        
        Returns:
            True if successful
        """
        if not self.is_connected:
            return False
        
        try:
            await self.client.ltrim(key, start, end)
            return True
        except Exception as e:
            logger.error(f"Redis ltrim error: {e}")
            return False
    
    async def setex(self, key: str, seconds: int, value: Any) -> bool:
        """
        Set key with expiration (alias for set with expire)
        """
        return await self.set(key, value, expire=seconds)
    
    async def publish(self, channel: str, message: Any) -> int:
        """
        Publish message to channel
        
        Args:
            channel: Channel name
            message: Message to publish
        
        Returns:
            Number of subscribers that received the message
        """
        if not self.is_connected:
            return 0
        
        try:
            if not isinstance(message, str):
                message = json.dumps(message, default=self._json_serializer)
            
            return await self.client.publish(channel, message)
        except Exception as e:
            logger.error(f"Redis publish error: {e}")
            return 0
    
    async def subscribe(self, channel: str, callback: callable):
        """
        Subscribe to a channel and register callback
        
        Args:
            channel: Channel name
            callback: Async function to call when message received
        """
        if not self.is_connected:
            return
        
        try:
            await self.pubsub.subscribe(channel)
            
            # Start listening in background
            asyncio.create_task(self._listen(callback))
        except Exception as e:
            logger.error(f"Redis subscribe error: {e}")
    
    async def _listen(self, callback: callable):
        """
        Listen for pub/sub messages
        """
        try:
            while self.is_connected:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True)
                if message:
                    await callback(message)
                await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Redis listen error: {e}")
    
    def _json_serializer(self, obj):
        """Custom JSON serializer for datetime objects"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")


# Global Redis client instance
redis_client = RedisClient()

# Import asyncio for the listen method
import asyncio
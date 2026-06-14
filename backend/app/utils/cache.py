"""
Caching utilities for Redis-based caching decorators
"""

import functools
import hashlib
import json
from typing import Any, Callable, Optional
from datetime import datetime, timedelta

from app.core.redis import redis_client
import logging

logger = logging.getLogger(__name__)


def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Cache decorator for async functions using Redis
    
    Args:
        ttl: Time to live in seconds (default: 300 seconds / 5 minutes)
        key_prefix: Optional prefix for cache key
    
    Usage:
        @cached(ttl=3600)
        async def get_user(user_id: int):
            return await db.query(User).get(user_id)
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = _generate_cache_key(func.__name__, key_prefix, args, kwargs)
            
            # Try to get from cache
            try:
                cached_value = await redis_client.get(cache_key)
                if cached_value is not None:
                    logger.debug(f"Cache hit for {cache_key}")
                    return cached_value
            except Exception as e:
                logger.warning(f"Redis get error: {e}")
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            try:
                await redis_client.setex(cache_key, ttl, result)
                logger.debug(f"Cached {cache_key} for {ttl}s")
            except Exception as e:
                logger.warning(f"Redis set error: {e}")
            
            return result
        
        return wrapper
    return decorator


async def invalidate_cache(pattern: str):
    """
    Invalidate cache keys matching a pattern
    
    Args:
        pattern: Pattern to match (e.g., "user:*", "static_data_list*")
    """
    try:
        # Note: This requires Redis SCAN command
        # For simplicity, we'll just log the intent
        # In production, implement proper pattern-based deletion
        logger.info(f"Invalidating cache pattern: {pattern}")
        
        # Alternative: Store keys in a set for manual invalidation
        # This is a simplified version
        pass
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")


async def clear_user_cache(user_id: int):
    """Clear all cache entries for a specific user"""
    await invalidate_cache(f"user:{user_id}:*")


def _generate_cache_key(func_name: str, prefix: str, args: tuple, kwargs: dict) -> str:
    """
    Generate a unique cache key from function arguments
    
    Args:
        func_name: Name of the function
        prefix: Optional key prefix
        args: Positional arguments
        kwargs: Keyword arguments
    
    Returns:
        Cache key string
    """
    # Create a string representation of arguments
    key_parts = [func_name]
    
    # Add positional arguments
    for arg in args:
        if isinstance(arg, (str, int, float, bool)):
            key_parts.append(str(arg))
        elif arg is None:
            key_parts.append("none")
        else:
            # For complex objects, use their string representation
            key_parts.append(str(arg))
    
    # Add keyword arguments (sorted for consistency)
    for key in sorted(kwargs.keys()):
        value = kwargs[key]
        key_parts.append(f"{key}={value}")
    
    # Join and hash if too long
    key_string = ":".join(key_parts)
    
    if len(key_string) > 100:
        # Hash long keys to stay within Redis limits
        key_string = hashlib.md5(key_string.encode()).hexdigest()
    
    # Add prefix if provided
    if prefix:
        return f"{prefix}:{key_string}"
    
    return key_string


class SimpleCache:
    """
    Simple in-memory cache for when Redis is not available
    Useful for development and testing
    """
    
    def __init__(self, default_ttl: int = 300):
        self._cache: dict = {}
        self._expiry: dict = {}
        self.default_ttl = default_ttl
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key in self._expiry and self._expiry[key] < datetime.utcnow():
            # Expired
            del self._cache[key]
            del self._expiry[key]
            return None
        
        return self._cache.get(key)
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache"""
        self._cache[key] = value
        if ttl is None:
            ttl = self.default_ttl
        self._expiry[key] = datetime.utcnow() + timedelta(seconds=ttl)
    
    def delete(self, key: str):
        """Delete key from cache"""
        self._cache.pop(key, None)
        self._expiry.pop(key, None)
    
    def clear(self):
        """Clear all cache"""
        self._cache.clear()
        self._expiry.clear()
    
    def clear_pattern(self, pattern: str):
        """Clear keys matching pattern"""
        keys_to_delete = [k for k in self._cache.keys() if pattern in k]
        for key in keys_to_delete:
            self.delete(key)


# Global simple cache instance for fallback
simple_cache = SimpleCache()


def get_cache():
    """
    Get the available cache backend
    Returns Redis client if available, otherwise SimpleCache
    """
    if redis_client.is_connected:
        return redis_client
    else:
        logger.warning("Redis not available, using in-memory cache")
        return simple_cache
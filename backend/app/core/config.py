from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "Asset Management System"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # API
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "webapp_db"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # TimescaleDB (optional)
    TIMESCALE_HOST: Optional[str] = "localhost"
    TIMESCALE_PORT: Optional[int] = 5432
    TIMESCALE_USER: Optional[str] = "postgres"
    TIMESCALE_PASSWORD: Optional[str] = "postgres"
    TIMESCALE_DB: Optional[str] = "webapp_db"
    
    # Redis (optional)
    REDIS_HOST: Optional[str] = "localhost"
    REDIS_PORT: Optional[int] = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: Optional[int] = 0
    
    # MongoDB (optional)
    MONGODB_HOST: Optional[str] = "localhost"
    MONGODB_PORT: Optional[int] = 27017
    MONGODB_USER: Optional[str] = "mongodb"
    MONGODB_PASSWORD: Optional[str] = "mongodb"
    MONGODB_DB: Optional[str] = "test_datasets"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Rate Limiting
    RATE_LIMIT_PER_USER: int = 60
    RATE_LIMIT_WEBSOCKET_PER_USER: int = 1000
    
    # Real-time Data
    REALTIME_DATA_FREQUENCY_HZ: int = 1000
    REALTIME_DOWNSAMPLE_FACTOR: int = 33
    REALTIME_BUFFER_SIZE: int = 1000
    
    # Performance
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    WEBSOCKET_MAX_CONNECTIONS: int = 500
    
    # Celery (optional)
    CELERY_BROKER_URL: Optional[str] = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: Optional[str] = "redis://localhost:6379/2"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # This allows extra fields in .env without errors

settings = Settings()

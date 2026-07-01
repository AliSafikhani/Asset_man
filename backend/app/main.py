"""
FastAPI Main Application Entry Point
Asset Management System with Multi-Tier Hierarchy
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router
from app.api.algorithms import router as algorithms_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Asset Management System...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified/created")
    
    logger.info(f"🚀 Server running on http://localhost:8000")
    logger.info(f"📚 API Documentation available at http://localhost:8000/docs")
    
    yield
    
    logger.info("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Asset Management System for Generators, Transformers, and Motors",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Directly include algorithms router at both /api and /api/v1
app.include_router(algorithms_router, prefix="/api/v1/algorithms")
app.include_router(algorithms_router, prefix="/api/algorithms")


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "status": "running",
        "endpoints": {
            "api": f"{settings.API_V1_STR}",
            "docs": "/docs",
            "health": "/health",
            "algorithms": "/api/v1/algorithms"
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
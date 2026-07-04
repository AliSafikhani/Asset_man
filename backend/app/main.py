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

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting up Asset Management System...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified/created")
    
    # Initialize Algorithm Manager
    try:
        from algorithms import AlgorithmManager
        algorithm_manager = AlgorithmManager()
        app.state.algorithm_manager = algorithm_manager
        logger.info("? Algorithm Manager initialized successfully")
        logger.info(f"?? Available assets: {list(algorithm_manager.algorithms.keys())}")
        for asset_type, test_types in algorithm_manager.algorithms.items():
            logger.info(f"   - {asset_type}: {list(test_types.keys())}")
            for test_type, algos in test_types.items():
                logger.info(f"       - {test_type}: {list(algos.keys())}")
    except ImportError as e:
        logger.warning(f"??  Algorithm Manager import failed: {e}")
        app.state.algorithm_manager = None
    except Exception as e:
        logger.warning(f"??  Algorithm Manager initialization failed: {e}")
        app.state.algorithm_manager = None
    
    logger.info(f"?? Server running on http://localhost:8000")
    logger.info(f"?? API Documentation available at http://localhost:8000/docs")
    
    yield
    
    # Shutdown
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


# Configure CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression for responses
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    algo_status = "available" if hasattr(app.state, 'algorithm_manager') and app.state.algorithm_manager else "unavailable"
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "status": "running",
        "algorithms": algo_status,
        "endpoints": {
            "api": f"{settings.API_V1_STR}",
            "docs": "/docs",
            "health": "/health",
            "algorithms": f"{settings.API_V1_STR}/algorithms"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    algo_status = "healthy" if (hasattr(app.state, 'algorithm_manager') and app.state.algorithm_manager) else "unavailable"
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "components": {
            "database": "healthy",
            "algorithms": algo_status
        }
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

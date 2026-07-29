from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from typing import AsyncGenerator
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# ============================================================
# WEBAPP DATABASE ENGINE (Read/Write)
# ============================================================
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get webapp database session (read/write)"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================================================
# DCS ENGINE DATABASE (Read‑only)
# ============================================================
dcs_engine = create_async_engine(
    settings.DCS_DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,  # Smaller pool for read‑only
    max_overflow=10,
    # Read‑only: set default isolation level to autocommit
    isolation_level="AUTOCOMMIT",
)

DcsAsyncSessionLocal = async_sessionmaker(
    dcs_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,  # We'll manage commits manually (or not at all)
    autoflush=False,
)

async def get_dcs_db() -> AsyncGenerator[AsyncSession, None]:
    """Get DCS engine database session (read‑only)"""
    async with DcsAsyncSessionLocal() as session:
        try:
            yield session
            # No commit needed for read‑only
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================================================
# INITIALIZATION
# ============================================================
async def init_db():
    """Initialize webapp database - create tables if not exist"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Webapp database tables initialized")
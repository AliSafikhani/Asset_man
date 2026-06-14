"""
Static Record model for 10k+ data records
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Enum, Index
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY
from app.models.user import Base
import enum


class DataType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    BOOLEAN = "boolean"
    JSON = "json"
    DATE = "date"


class StaticRecord(Base):
    """Static data record model for 10k+ records"""
    __tablename__ = "static_records"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    data_type = Column(Enum(DataType), default=DataType.TEXT, nullable=False)
    
    # Value stored as JSON for flexibility
    value = Column(JSON, nullable=False)
    
    # Tags for filtering (PostgreSQL array)
    tags = Column(ARRAY(String), default=list)
    
    # Metadata for additional info
    extra_metadata = Column(JSON, default=dict)  # Renamed from 'metadata' to avoid SQLAlchemy conflict    
    # Access control
    is_public = Column(Boolean, default=True, index=True)
    priority = Column(Integer, default=0)  # 0-100, higher = more important
    
    # Tracking
    view_count = Column(Integer, default=0)
    created_by = Column(Integer, nullable=False, index=True)
    updated_by = Column(Integer, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_deleted = Column(Boolean, default=False, index=True)
    
    # Composite indexes for performance
    __table_args__ = (
        Index('idx_category_priority', 'category', 'priority'),
        Index('idx_created_at_public', 'created_at', 'is_public'),
        Index('idx_tags', 'tags', postgresql_using='gin'),
    )
    
    def __repr__(self):
        return f"<StaticRecord {self.title}>"
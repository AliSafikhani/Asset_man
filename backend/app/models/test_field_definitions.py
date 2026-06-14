from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, Date, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class TestFieldDefinition(Base):
    __tablename__ = "test_field_definitions"
    
    id = Column(Integer, primary_key=True, index=True)
    test_type_id = Column(Integer, ForeignKey("test_types.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    display_name = Column(String(200), nullable=False)
    unit = Column(String(50))
    description = Column(Text)
    data_type = Column(String(50), default="number")
    is_required = Column(Boolean, default=False)
    min_value = Column(Float)
    max_value = Column(Float)
    allowed_values = Column(JSON)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

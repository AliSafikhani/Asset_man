from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    test_type_id = Column(Integer, ForeignKey("test_types.id"), nullable=False)
    test_date = Column(Date, nullable=False)
    lab_name = Column(String(200))
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # parameters = relationship("TestParameter", back_populates="test_result", cascade="all, delete-orphan", lazy='joined')

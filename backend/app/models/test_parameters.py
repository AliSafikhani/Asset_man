from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class TestParameter(Base):
    __tablename__ = "test_parameters"
    
    id = Column(Integer, primary_key=True, index=True)
    test_result_id = Column(Integer, ForeignKey("test_results.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    field_value = Column(Float)
    field_value_text = Column(Text)
    field_value_date = Column(Date)
    field_value_boolean = Column(Boolean)
    unit = Column(String(50))
    is_pass = Column(Boolean)
    limit_min = Column(Float)
    limit_max = Column(Float)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    test_result = relationship("TestResult", back_populates="parameters")

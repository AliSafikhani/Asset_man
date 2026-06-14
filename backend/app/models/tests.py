from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class TestTypes(Base, TimestampMixin):
    __tablename__ = "test_types"
    
    id = Column(Integer, primary_key=True, index=True)
    test_name = Column(String(100), nullable=False)
    asset_type = Column(String(50), nullable=False)
    test_category = Column(String(50))
    description = Column(Text)
    parameters_schema = Column(JSON)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    test_results = relationship("TestResultsHeader", back_populates="test_type")

class TestResultsHeader(Base, TimestampMixin):
    __tablename__ = "test_results_header"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    test_type_id = Column(Integer, ForeignKey("test_types.id"), nullable=False)
    test_date = Column(Date, nullable=False)
    test_performed_by = Column(Integer, ForeignKey("users.id"))
    test_approved_by = Column(Integer, ForeignKey("users.id"))
    report_number = Column(String(100))
    equipment_used = Column(String(200))
    weather_conditions = Column(String(200))
    temperature_c = Column(Float)
    humidity_percent = Column(Float)
    remarks = Column(Text)
    status = Column(String(50), default="pending")
    
    # Relationships
    test_type = relationship("TestTypes", back_populates="test_results")
    test_details = relationship("TestResultsDetails", back_populates="test_header", cascade="all, delete-orphan")

class TestResultsDetails(Base):
    __tablename__ = "test_results_details"
    
    id = Column(Integer, primary_key=True, index=True)
    test_header_id = Column(Integer, ForeignKey("test_results_header.id", ondelete="CASCADE"), nullable=False)
    parameter_name = Column(String(100), nullable=False)
    parameter_value = Column(Float)
    parameter_unit = Column(String(50))
    limit_min = Column(Float)
    limit_max = Column(Float)
    is_pass = Column(Boolean)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    test_header = relationship("TestResultsHeader", back_populates="test_details")

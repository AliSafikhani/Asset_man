from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class AlarmRuleEnhanced(Base):
    __tablename__ = "alarm_rules_enhanced"
    
    id = Column(Integer, primary_key=True, index=True)
    signal_mapping_id = Column(Integer, ForeignKey("dcs_signal_mappings.id", ondelete="CASCADE"), nullable=False)
    alarm_level = Column(Integer, nullable=False)
    condition_type = Column(String(20), nullable=False)
    threshold_min = Column(Float)
    threshold_max = Column(Float)
    severity = Column(String(20), nullable=False)
    message = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    signal_mapping = relationship("DCSMapping", back_populates="alarm_rules")

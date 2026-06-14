from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class DCSMapping(Base, TimestampMixin):
    __tablename__ = "dcs_signal_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    signal_name = Column(String(100), nullable=False)
    display_name = Column(String(200))
    unit = Column(String(50))
    table_name = Column(String(200), nullable=False)
    column_name = Column(String(200), nullable=False)
    data_type = Column(String(50), default="float")
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    asset = relationship("Assets", foreign_keys=[asset_id])
    alarm_rules = relationship("AlarmRuleEnhanced", back_populates="signal_mapping", cascade="all, delete-orphan")

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class AlarmRule(Base):
    __tablename__ = "alarm_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"))
    threshold_min = Column(Float)
    threshold_max = Column(Float)
    unit = Column(String(50))
    severity = Column(String(20), nullable=False)
    delay_seconds = Column(Integer, default=0)
    message = Column(Text)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    asset = relationship("Assets", foreign_keys=[asset_id])

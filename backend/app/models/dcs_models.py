from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class DCSignal(Base):
    __tablename__ = "dcs_signals"
    
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    kks_code = Column(String(100), nullable=False)
    signal_name = Column(String(200))
    unit = Column(String(50))
    description = Column(Text)
    data_type = Column(String(50), default="float")
    is_assigned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AssetDCSMapping(Base):
    __tablename__ = "asset_dcs_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    dcs_signal_id = Column(Integer, ForeignKey("dcs_signals.id"), nullable=False)
    display_name = Column(String(200))
    unit = Column(String(50))
    min_alarm = Column(Float)
    max_alarm = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DCSData(Base):
    __tablename__ = "dcs_data"
    
    id = Column(Integer, primary_key=True, index=True)
    dcs_signal_id = Column(Integer, ForeignKey("dcs_signals.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    value = Column(Float)
    quality = Column(String(20), default="GOOD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

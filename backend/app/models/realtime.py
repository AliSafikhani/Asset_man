from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.sql import func
from app.models.base import Base, TimestampMixin

class RealtimeData(Base):
    __tablename__ = "realtime_data"
    
    time = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    parameter_name = Column(String(100), nullable=False)
    parameter_value = Column(Float)
    parameter_unit = Column(String(50))
    quality_score = Column(Float, default=1.0)
    is_alarm = Column(Boolean, default=False)
    extra_data = Column(JSON, default={})

class SignalDefinitions(Base):
    __tablename__ = "signal_definitions"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_type = Column(String(50), nullable=False)
    parameter_name = Column(String(100), nullable=False)
    display_name = Column(String(200))
    unit = Column(String(50))
    data_type = Column(String(20))
    min_normal = Column(Float)
    max_normal = Column(Float)
    critical_min = Column(Float)
    critical_max = Column(Float)
    is_critical = Column(Boolean, default=False)
    display_order = Column(Integer)
    is_active = Column(Boolean, default=True)

class AlarmRules(Base, TimestampMixin):
    __tablename__ = "alarm_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"))
    asset_type = Column(String(50))
    parameter_name = Column(String(100), nullable=False)
    alarm_type = Column(String(20))
    threshold_min = Column(Float)
    threshold_max = Column(Float)
    severity = Column(String(20))
    message = Column(Text)
    is_active = Column(Boolean, default=True)

class AlarmsLog(Base):
    __tablename__ = "alarms_log"
    
    id = Column(Integer, primary_key=True, index=True)
    alarm_rule_id = Column(Integer, ForeignKey("alarm_rules.id"))
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    parameter_name = Column(String(100))
    actual_value = Column(Float)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer, ForeignKey("users.id"))
    severity = Column(String(20))
    status = Column(String(20), default="active")

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class AlarmRule(Base):
    __tablename__ = "alarm_rules"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
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

class AlarmHistory(Base):
    __tablename__ = "alarm_history"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    alarm_rule_id = Column(Integer, ForeignKey("alarm_rules.id"))
    asset_id = Column(Integer, ForeignKey("assets.id"))
    actual_value = Column(Float)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String(20), default="active")
    notes = Column(Text)
    
    alarm_rule = relationship("AlarmRule", foreign_keys=[alarm_rule_id])
    asset = relationship("Assets", foreign_keys=[asset_id])

class Event(Base):
    __tablename__ = "events"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    event_number = Column(String(50), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"))
    event_type = Column(String(50), nullable=False)
    priority = Column(String(20), nullable=False)
    status = Column(String(20), default="open")
    reported_date = Column(Date, nullable=False)
    reported_by = Column(Integer, ForeignKey("users.id"))
    description = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    due_date = Column(Date)
    completed_date = Column(Date)
    actions_taken = Column(Text)
    cost = Column(Float)
    downtime_hours = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    asset = relationship("Assets", foreign_keys=[asset_id])
    checklist = relationship("EventChecklist", back_populates="event", cascade="all, delete-orphan")
    parts = relationship("EventPart", back_populates="event", cascade="all, delete-orphan")
    comments = relationship("EventComment", back_populates="event", cascade="all, delete-orphan")

class EventChecklist(Base):
    __tablename__ = "event_checklist"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))
    task_name = Column(String(500), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_by = Column(Integer, ForeignKey("users.id"))
    completed_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    
    event = relationship("Event", back_populates="checklist")

class EventPart(Base):
    __tablename__ = "event_parts"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))
    part_name = Column(String(200), nullable=False)
    quantity = Column(Integer, default=1)
    unit_cost = Column(Float)
    total_cost = Column(Float)
    
    event = relationship("Event", back_populates="parts")

class EventComment(Base):
    __tablename__ = "event_comments"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))
    comment = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    event = relationship("Event", back_populates="comments")

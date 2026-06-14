from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class MaintenanceEvent(Base):
    __tablename__ = "maintenance_events"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    event_date = Column(Date, nullable=False)
    event_type = Column(String(100))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    actions_taken = Column(Text)
    recommendations = Column(Text)
    cost = Column(Float)
    downtime_hours = Column(Float)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    asset = relationship("Assets", foreign_keys=[asset_id])
    attachments = relationship("EventAttachment", back_populates="event", cascade="all, delete-orphan")

class EventAttachment(Base):
    __tablename__ = "event_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("maintenance_events.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255))
    file_path = Column(Text)
    file_size = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    event = relationship("MaintenanceEvent", back_populates="attachments")

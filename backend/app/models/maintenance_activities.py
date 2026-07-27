# backend/app/models/maintenance_activities.py
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class MaintenanceActivities(Base, TimestampMixin):
    __tablename__ = "maintenance_activities"

    id = Column(Integer, primary_key=True, index=True)
    
    # Hierarchy
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    
    # Activity Core Details
    title = Column(String(255), nullable=False)
    description = Column(Text)
    maintenance_order = Column(String(50), nullable=False)
    maintenance_section = Column(String(100), nullable=False)
    oil_detail = Column(String(100), nullable=False)
    priority = Column(String(20), nullable=False)
    
    # Workflow Status
    status = Column(String(30), nullable=False, default="planned")
    
    # Scheduling & Execution Timeline
    scheduled_date = Column(DateTime)
    actual_start = Column(DateTime)
    completion_date = Column(DateTime)
    
    # Human Resources
    assigned_technician = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    # Operational Metrics
    meter_reading = Column(Float)
    downtime_minutes = Column(Integer, default=0)
    
    # Financials
    labor_cost = Column(Float, default=0.00)
    parts_cost = Column(Float, default=0.00)
    
    # total_cost is REMOVED - it's a generated column in the database
    
    # Findings & Documentation
    findings_description = Column(Text)
    action_taken = Column(Text)
    attachments = Column(JSON, default=[])
    recommended_next_date = Column(DateTime)
    
    # Asset-Specific Dynamic Data
    extra_data = Column(JSON, default={})
    
    # Audit Trail
    created_by = Column(Integer)
    updated_by = Column(Integer)
    
    # Relationships
    plant = relationship("Plants", back_populates="maintenance_activities")
    asset = relationship("Assets", back_populates="maintenance_activities")
    technician = relationship("Users", foreign_keys=[assigned_technician])

    # ✅ Optional: Add a computed property for convenience
    @property
    def total_cost(self):
        """Compute total_cost from labor_cost and parts_cost (matches database generated column)"""
        return (self.labor_cost or 0) + (self.parts_cost or 0)
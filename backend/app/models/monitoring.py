"""
Monitoring Models for Live Monitoring Module
File: app/models/monitoring.py
Description: SQLAlchemy models for signal groups, configuration, and visualization
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, DECIMAL, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class SignalGroup(Base, TimestampMixin):
    """User-defined signal groups per plant (e.g., Voltage, Current, Temperature)"""
    __tablename__ = "signal_groups"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    group_name = Column(String(50), nullable=False)
    description = Column(Text)
    color_hex = Column(String(7), default="#808080")
    icon = Column(String(50))
    sort_order = Column(Integer, default=0)

    # Relationships
    plant = relationship("Plants", foreign_keys=[plant_id])
    signal_configs = relationship("SignalConfiguration", back_populates="group", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('plant_id', 'group_name', name='uq_signal_groups_plant_name'),
    )


class SignalConfiguration(Base, TimestampMixin):
    """Main configuration for each signal per plant"""
    __tablename__ = "signal_configuration"

    id = Column(Integer, primary_key=True, index=True)
    signal_id = Column(Integer, nullable=False)  # Logical reference to dcs_db.signal.id
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)

    # Assignment
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"))
    group_id = Column(Integer, ForeignKey("signal_groups.id", ondelete="SET NULL"))

    # Display settings
    custom_name = Column(String(100))
    custom_unit = Column(String(20))
    color_hex = Column(String(7), default="#2196F3")
    line_type = Column(String(20), default="solid")  # solid, dashed, dotted, dashdot
    line_width = Column(Integer, default=2)
    scale_factor = Column(DECIMAL(5,2), default=1.00)
    y_axis_side = Column(String(10), default="left")  # left, right

    # Alarm settings
    alert_threshold_min = Column(DECIMAL(15,4))
    alert_threshold_max = Column(DECIMAL(15,4))
    is_threshold_enabled = Column(Boolean, default=False)

    # Visibility
    is_visible = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    # Metadata
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(Integer)

    # Relationships
    plant = relationship("Plants", foreign_keys=[plant_id])
    asset = relationship("Assets", foreign_keys=[asset_id])
    group = relationship("SignalGroup", back_populates="signal_configs")
    visualization_settings = relationship("SignalVisualizationSettings", back_populates="signal_config", cascade="all, delete-orphan")
    alarm_history = relationship("SignalAlarmHistory", back_populates="signal_config", cascade="all, delete-orphan")
    comparison_items = relationship("ComparisonGroupItem", back_populates="signal_config", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('signal_id', 'plant_id', name='uq_signal_config_signal_plant'),
    )


class SignalVisualizationSettings(Base, TimestampMixin):
    """Per-user visualization settings for a signal"""
    __tablename__ = "signal_visualization_settings"

    id = Column(Integer, primary_key=True, index=True)
    signal_config_id = Column(Integer, ForeignKey("signal_configuration.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer)

    # Chart-specific settings (override defaults)
    is_hidden = Column(Boolean, default=False)
    custom_color_hex = Column(String(7))
    custom_line_type = Column(String(20))
    custom_line_width = Column(Integer)
    custom_scale_factor = Column(DECIMAL(5,2))

    # Relationships
    signal_config = relationship("SignalConfiguration", back_populates="visualization_settings")

    __table_args__ = (
        UniqueConstraint('signal_config_id', 'user_id', name='uq_signal_vis_config_user'),
    )


class SignalAlarmHistory(Base):
    """Track alarm events for signals"""
    __tablename__ = "signal_alarm_history"

    id = Column(Integer, primary_key=True, index=True)
    signal_config_id = Column(Integer, ForeignKey("signal_configuration.id", ondelete="CASCADE"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"))

    alarm_type = Column(String(20), nullable=False)  # MIN, MAX, RATE
    triggered_value = Column(DECIMAL(15,4), nullable=False)
    threshold_value = Column(DECIMAL(15,4), nullable=False)
    severity = Column(String(20), default="warning")  # info, warning, critical

    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(Integer)
    cleared_at = Column(DateTime(timezone=True))
    is_cleared = Column(Boolean, default=False)

    notes = Column(Text)

    # Relationships
    signal_config = relationship("SignalConfiguration", back_populates="alarm_history")
    asset = relationship("Assets", foreign_keys=[asset_id])


class ComparisonGroup(Base, TimestampMixin):
    """User-defined comparison groups for cross-asset analysis"""
    __tablename__ = "comparison_groups"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    group_type = Column(String(50))  # voltage, current, temperature, vibration
    created_by = Column(Integer)

    # Relationships
    plant = relationship("Plants", foreign_keys=[plant_id])
    items = relationship("ComparisonGroupItem", back_populates="comparison_group", cascade="all, delete-orphan")


class ComparisonGroupItem(Base):
    """Signals belonging to a comparison group"""
    __tablename__ = "comparison_group_items"

    id = Column(Integer, primary_key=True, index=True)
    comparison_group_id = Column(Integer, ForeignKey("comparison_groups.id", ondelete="CASCADE"), nullable=False)
    signal_config_id = Column(Integer, ForeignKey("signal_configuration.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    comparison_group = relationship("ComparisonGroup", back_populates="items")
    signal_config = relationship("SignalConfiguration", back_populates="comparison_items")

    __table_args__ = (
        UniqueConstraint('comparison_group_id', 'signal_config_id', name='uq_comp_group_signal'),
    )
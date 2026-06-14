from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base, TimestampMixin

class Motors(Base, TimestampMixin):
    __tablename__ = "motors"
    
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    
    # Basic Specifications
    motor_type = Column(String(50))
    frame_size = Column(String(50))
    mounting_type = Column(String(50))
    duty_type = Column(String(50))
    enclosure_type = Column(String(50))
    
    # Power Ratings
    power_hp = Column(Float)
    power_kw = Column(Float)
    service_factor = Column(Float)
    
    # Electrical Parameters
    voltage_v = Column(Float)
    current_a = Column(Float)
    starting_current_a = Column(Float)
    frequency_hz = Column(Float)
    number_of_phases = Column(Integer, default=3)
    
    # Induction Motor
    synchronous_speed_rpm = Column(Integer)
    full_load_speed_rpm = Column(Integer)
    slip_percent = Column(Float)
    nema_design = Column(String(10))
    
    # Efficiency
    efficiency_class = Column(String(20))
    efficiency_100_percent = Column(Float)
    efficiency_75_percent = Column(Float)
    efficiency_50_percent = Column(Float)
    
    # Physical
    bearing_type = Column(String(30))
    shaft_diameter_mm = Column(Float)
    weight_kg = Column(Float)
    inertia_kg_m2 = Column(Float)
    
    # Environmental
    insulation_class = Column(String(10))
    temperature_rise_c = Column(Float)
    ip_rating = Column(String(10))
    
    # VFD Compatibility
    vfd_compatible = Column(Boolean, default=False)
    
    # Relationships
    asset = relationship("Assets", back_populates="motor")

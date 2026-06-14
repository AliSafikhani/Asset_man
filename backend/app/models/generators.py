from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base, TimestampMixin

class Generators(Base, TimestampMixin):
    __tablename__ = "generators"
    
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    
    # Basic Specifications
    generator_type = Column(String(50))
    prime_mover_type = Column(String(50))
    fuel_type = Column(String(50))
    power_rating_mw = Column(Float)
    power_rating_mva = Column(Float)
    power_factor = Column(Float)
    efficiency_percent = Column(Float)
    
    # Electrical Parameters
    voltage_kv = Column(Float)
    current_a = Column(Float)
    frequency_hz = Column(Float)
    number_of_phases = Column(Integer, default=3)
    stator_connection = Column(String(20))
    rotor_connection = Column(String(20))
    
    # Synchronous Generator
    synchronous_reactance_xd = Column(Float)
    transient_reactance_xd = Column(Float)
    subtransient_reactance_xd = Column(Float)
    inertia_constant_h = Column(Float)
    short_circuit_ratio = Column(Float)
    
    # Induction Generator
    rotor_resistance_r2 = Column(Float)
    stator_resistance_r1 = Column(Float)
    slip_at_rated_load = Column(Float)
    
    # Physical Characteristics
    cooling_method = Column(String(50))
    insulation_class = Column(String(20))
    bearing_type = Column(String(50))
    rotor_speed_rpm = Column(Integer)
    weight_kg = Column(Float)
    
    # Operational Limits
    max_continuous_power_mw = Column(Float)
    min_load_percent = Column(Float)
    
    # Relationships
    asset = relationship("Assets", back_populates="generator")

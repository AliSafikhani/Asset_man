# backend\app\models\transformers.py
from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base, TimestampMixin

class Transformers(Base, TimestampMixin):
    __tablename__ = "transformers"
    
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    
    # Basic Specifications
    transformer_type = Column(String(50))
    cooling_type = Column(String(50))
    number_of_windings = Column(Integer, default=2)
    
    # Power Ratings
    power_rating_mva = Column(Float)
    power_rating_mva_forced = Column(Float)
    
    # Voltage Ratings
    hv_voltage_kv = Column(Float)
    lv_voltage_kv = Column(Float)
    tertiary_voltage_kv = Column(Float)
    hv_tap_range_percent = Column(Float)
    number_of_taps = Column(Integer)
    
    # Impedance
    impedance_percent = Column(Float)
    hv_resistance_ohms = Column(Float)
    lv_resistance_ohms = Column(Float)
    magnetizing_current_percent = Column(Float)
    
    # Insulation
    insulation_type = Column(String(50))
    insulation_class = Column(String(20))
    insulation_level_hv_kv = Column(Float)
    insulation_level_lv_kv = Column(Float)
    
    # Physical
    vector_group = Column(String(10))
    frequency_hz = Column(Float)
    oil_type = Column(String(50))
    oil_volume_liters = Column(Float)
    weight_kg = Column(Float)
    
    # Operational
    no_load_loss_w = Column(Float)
    load_loss_w = Column(Float)
    efficiency_percent = Column(Float)
    temperature_rise_oil_c = Column(Float)
    temperature_rise_winding_c = Column(Float)
    
    # Accessories
    has_on_load_tap_changer = Column(Boolean, default=False)
    has_buchholz_relay = Column(Boolean, default=True)
    has_pressure_relief = Column(Boolean, default=True)
    
    # Relationships
    asset = relationship("Assets", back_populates="transformer")

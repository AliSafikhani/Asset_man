from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Assets(Base, TimestampMixin):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    asset_type = Column(String(50), nullable=False)
    asset_name = Column(String(200), nullable=False)
    asset_code = Column(String(100), unique=True, nullable=False)
    asset_tag = Column(String(100))
    manufacturer = Column(String(200))
    model = Column(String(200))
    serial_number = Column(String(200))
    manufacturing_year = Column(Integer)
    installation_date = Column(DateTime)
    commissioning_date = Column(DateTime)
    operational_status = Column(String(50), default="active")
    asset_health_score = Column(Float)
    criticality_level = Column(String(20))
    location_within_plant = Column(String(200))
    technical_documentation_url = Column(Text)
    photo_url = Column(Text)
    extra_data = Column(JSON, default={})  # renamed from metadata
    
    # Relationships
    plant = relationship("Plants", back_populates="assets")
    generator = relationship("Generators", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    transformer = relationship("Transformers", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    motor = relationship("Motors", back_populates="asset", uselist=False, cascade="all, delete-orphan")

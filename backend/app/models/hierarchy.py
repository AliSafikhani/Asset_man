from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Centroids(Base, TimestampMixin):
    __tablename__ = "centroids"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    abbreviation = Column(String(20))
    contact_person = Column(String(200))
    contact_email = Column(String(200))
    contact_phone = Column(String(50))
    address_line1 = Column(Text)
    address_line2 = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    timezone = Column(String(100), default="UTC")
    status = Column(String(50), default="active")
    extra_data = Column(JSON, default={})  # renamed from metadata
    
    # Relationships
    companies = relationship("Companies", back_populates="centroid", cascade="all, delete-orphan")

class Companies(Base, TimestampMixin):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    centroid_id = Column(Integer, ForeignKey("centroids.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    abbreviation = Column(String(20))
    company_type = Column(String(50))
    contact_person = Column(String(200))
    contact_email = Column(String(200))
    contact_phone = Column(String(50))
    address_line1 = Column(Text)
    address_line2 = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    status = Column(String(50), default="active")
    parent_company_id = Column(Integer, ForeignKey("companies.id"))
    extra_data = Column(JSON, default={})  # renamed from metadata
    
    # Relationships
    centroid = relationship("Centroids", back_populates="companies")
    plants = relationship("Plants", back_populates="company", cascade="all, delete-orphan")

class Plants(Base, TimestampMixin):
    __tablename__ = "plants"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    plant_type = Column(String(50))
    plant_manager_name = Column(String(200))
    plant_manager_email = Column(String(200))
    plant_manager_phone = Column(String(50))
    address_line1 = Column(Text)
    address_line2 = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    commissioning_date = Column(DateTime)
    operational_status = Column(String(50), default="operational")
    installed_capacity_mw = Column(Float)
    extra_data = Column(JSON, default={})  # renamed from metadata
    
    # Relationships
    company = relationship("Companies", back_populates="plants")
    assets = relationship("Assets", back_populates="plant", cascade="all, delete-orphan")

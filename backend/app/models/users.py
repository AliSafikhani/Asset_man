from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Users(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    full_name = Column(String(200))
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    user_hierarchy = relationship("UserHierarchy", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshTokens", back_populates="user", cascade="all, delete-orphan")

class UserHierarchy(Base, TimestampMixin):
    __tablename__ = "user_hierarchy"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    level_type = Column(String(50), nullable=False)
    level_id = Column(Integer, nullable=False)
    role = Column(String(50), nullable=False)
    permissions = Column(JSON, default={})
    
    # Relationships
    user = relationship("Users", back_populates="user_hierarchy")

class RefreshTokens(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("Users", back_populates="refresh_tokens")

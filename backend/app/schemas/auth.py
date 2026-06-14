from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.schemas import UserRoleEnum, LevelTypeEnum

# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=200)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# User Hierarchy Schemas
class UserHierarchyBase(BaseModel):
    level_type: LevelTypeEnum
    level_id: int
    role: UserRoleEnum
    permissions: Optional[Dict[str, Any]] = {}

class UserHierarchyCreate(UserHierarchyBase):
    user_id: int

class UserHierarchyResponse(UserHierarchyBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Authentication Schemas
class LoginRequest(BaseModel):
    username: str
    password: str
    captcha_token: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

class UserWithHierarchyResponse(UserResponse):
    hierarchies: List[UserHierarchyResponse] = []
    permissions: Dict[str, Any] = {}

# Captcha Verification
class CaptchaVerifyRequest(BaseModel):
    token: str

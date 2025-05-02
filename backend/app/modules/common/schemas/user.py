# backend/app/modules/common/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str
    invitation_code: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

class UserInDB(UserBase):
    id: int
    created_at: datetime
    email_verified: bool = False

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

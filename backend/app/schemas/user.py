# backend/app/schemas/user.py
from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False

class UserCreate(UserBase):
    password: str
    email: str  # 注册时邮箱为必填项

class UserUpdate(UserBase):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: int
    password: str
    email_verified: bool = False
    verification_token: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    email_verified: bool = False

    class Config:
        from_attributes = True

class EmailVerification(BaseModel):
    token: str
# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.config import TABLE_PREFIX

class User(Base):
    __tablename__ = f"{TABLE_PREFIX['COMMON']}users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    email_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True)

    # 建立关系
    tasks = relationship("Task", back_populates="user")
    plans = relationship("Plan", back_populates="user")
    achievements = relationship("Achievement", back_populates="user")
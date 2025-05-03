# backend/app/models/plan.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func
from app.config import TABLE_PREFIX

class Plan(Base):
    __tablename__ = f"{TABLE_PREFIX['STUDY']}plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX['COMMON']}users.id"))
    text = Column(String, index=True)
    completed = Column(Boolean, default=False)
    started = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)

    # 建立关系
    user = relationship("User", back_populates="plans")
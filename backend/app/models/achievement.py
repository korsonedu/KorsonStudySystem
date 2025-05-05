# backend/app/models/achievement.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func
from app.core.config import TABLE_PREFIX

class Achievement(Base):
    __tablename__ = f"{TABLE_PREFIX['STUDY']}achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX['COMMON']}users.id"))
    type = Column(String)
    level = Column(Integer)
    unlocked_at = Column(DateTime, server_default=func.now())

    # 建立关系
    user = relationship("User", back_populates="achievements")
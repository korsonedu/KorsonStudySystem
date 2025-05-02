# backend/app/modules/study/models/task.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.config import TABLE_PREFIX

class Task(Base):
    __tablename__ = f"{TABLE_PREFIX['STUDY']}tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    duration = Column(Integer)
    start = Column(DateTime)
    end = Column(DateTime)
    completed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX['COMMON']}users.id"))

    user = relationship("app.modules.common.models.user.User", back_populates="tasks")

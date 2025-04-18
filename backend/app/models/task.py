from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    duration = Column(Integer)
    start = Column(DateTime)
    end = Column(DateTime)
    completed = Column(Boolean, default=False)  # 确保包含 completed 字段
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="tasks")
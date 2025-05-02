# backend/app/modules/common/models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from app.config import TABLE_PREFIX

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
    # 这些关系将在各个模块的模型中定义
    # 学习追踪系统
    tasks = relationship("app.modules.study.models.task.Task", back_populates="user")
    plans = relationship("app.modules.study.models.plan.Plan", back_populates="user")
    achievements = relationship("app.modules.study.models.achievement.Achievement", back_populates="user")
    
    # 课程系统（未来扩展）
    # courses = relationship("app.modules.course.models.course.Course", back_populates="user")
    
    # 排行榜系统（未来扩展）
    # scores = relationship("app.modules.leaderboard.models.score.Score", back_populates="user")
    
    # 题库系统（未来扩展）
    # attempts = relationship("app.modules.quiz.models.attempt.Attempt", back_populates="user")

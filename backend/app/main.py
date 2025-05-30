# backend/app/main.py
import pytz
import os
from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .routers import tasks, plans, achievements, auth, statistics, users, avatar
from .database import get_db
from .database import engine, Base
from .core.config import (
    ENVIRONMENT, FRONTEND_URL, APP_NAME, APP_DESCRIPTION, APP_VERSION,
    CORS_ORIGINS, CORS_ALLOW_CREDENTIALS, CORS_ALLOW_METHODS, CORS_ALLOW_HEADERS,
    TIMEZONE
)

# 设置默认时区为中国时区
os.environ['TZ'] = TIMEZONE
try:
    # 尝试设置系统时区
    time_zone = pytz.timezone(TIMEZONE)
except Exception:
    pass

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建FastAPI应用
app = FastAPI(
    title=APP_NAME,
    description=APP_DESCRIPTION,
    version=APP_VERSION
)

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # 使用配置中的CORS_ORIGINS
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
    expose_headers=["*"]
)

# 健康检查路由
@app.get("/api/health")
def health_check():
    """健康检查接口，用于监控系统是否正常运行"""
    return {
        "status": "ok",
        "version": APP_VERSION,
        "environment": ENVIRONMENT
    }

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# 注册用户路由
app.include_router(users.router, prefix="/api/users", tags=["users"])

# 注册头像路由
app.include_router(avatar.router, prefix="/api/avatar", tags=["avatar"])

# 注册任务路由
app.include_router(tasks.router, prefix="/api/study/tasks", tags=["tasks"])

# 注册计划路由
app.include_router(plans.router, prefix="/api/study/plans", tags=["plans"])

# 注册成就路由
app.include_router(achievements.router, prefix="/api/study/achievements", tags=["achievements"])

# 注册统计路由
app.include_router(statistics.router, prefix="/api/study/statistics", tags=["statistics"])

# WebSocket路由已移至独立服务

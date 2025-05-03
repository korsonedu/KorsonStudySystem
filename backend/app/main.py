# backend/app/main.py
import pytz
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import tasks, plans, achievements, auth, statistics
from .database import engine, Base
from .config import (
    ENVIRONMENT, FRONTEND_URL, APP_NAME, APP_DESCRIPTION, APP_VERSION,
    CORS_ORIGINS, CORS_ALLOW_CREDENTIALS, CORS_ALLOW_METHODS, CORS_ALLOW_HEADERS,
    TIMEZONE
)

# 设置默认时区为中国时区
os.environ['TZ'] = TIMEZONE
try:
    # 尝试设置系统时区
    time_zone = pytz.timezone(TIMEZONE)
    print(f"Timezone set to: {TIMEZONE}")
except Exception as e:
    print(f"Error setting timezone: {e}")

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
    allow_origins=["*"],  # 允许所有来源，简化开发环境的跨域问题
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

print(f"Running in {ENVIRONMENT} mode. CORS configured for: {CORS_ORIGINS}")

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

# 注册任务路由 - 只使用 /api/study/tasks 路径
app.include_router(tasks.router, prefix="/api/study/tasks", tags=["tasks"])

# 注册计划路由 - 只使用 /api/study/plans 路径
app.include_router(plans.router, prefix="/api/study/plans", tags=["plans"])

# 注册成就路由 - 只使用 /api/study/achievements 路径
app.include_router(achievements.router, prefix="/api/study/achievements", tags=["achievements"])

# 注册统计路由 - 只使用 /api/study/statistics 路径
app.include_router(statistics.router, prefix="/api/study/statistics", tags=["statistics"])
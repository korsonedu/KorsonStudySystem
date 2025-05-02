# backend/app/main.py
import pytz
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .config import (
    ENVIRONMENT, FRONTEND_URL, APP_NAME, APP_DESCRIPTION, APP_VERSION,
    CORS_ORIGINS, CORS_ALLOW_CREDENTIALS, CORS_ALLOW_METHODS, CORS_ALLOW_HEADERS,
    TIMEZONE
)

# 导入模块路由
from .modules.common.routers import common_router
from .modules.study.routers import study_router
from .modules.course.routers import course_router
from .modules.leaderboard.routers import leaderboard_router
from .modules.quiz.routers import quiz_router

# 导入认证模块（用于替代旧的auth.py）
from .modules.common.routers.auth import get_current_active_user, get_current_user

# 导入所有模型以便创建数据库表
from .modules.common.models import *
from .modules.study.models import *

# 设置默认时区为中国时区
os.environ['TZ'] = TIMEZONE
try:
    # 尝试设置系统时区
    time_zone = pytz.timezone(TIMEZONE)
    print(f"Timezone set to: {TIMEZONE}")
except Exception as e:
    print(f"Error setting timezone: {e}")

# 创建数据库表
from .database import Base
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
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS
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
app.include_router(common_router, prefix="/api/auth", tags=["auth"])
app.include_router(study_router, prefix="/api", tags=["study"])

# 注册未来的模块路由（目前为空）
app.include_router(course_router, prefix="/api", tags=["course"])
app.include_router(leaderboard_router, prefix="/api", tags=["leaderboard"])
app.include_router(quiz_router, prefix="/api", tags=["quiz"])
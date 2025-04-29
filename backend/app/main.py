# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, tasks, plans, achievements, statistics
from .database import engine
from .models import Base
from .config import (
    ENVIRONMENT, FRONTEND_URL, APP_NAME, APP_DESCRIPTION, APP_VERSION,
    CORS_ORIGINS, CORS_ALLOW_CREDENTIALS, CORS_ALLOW_METHODS, CORS_ALLOW_HEADERS
)

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
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(plans.router, prefix="/api/plans", tags=["plans"])
app.include_router(achievements.router, prefix="/api/achievements", tags=["achievements"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])
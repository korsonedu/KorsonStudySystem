# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, tasks, plans, achievements, statistics
from .database import engine
from .models import Base
import os

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 根据环境配置CORS
import os

app = FastAPI()

# 获取环境变量
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# 配置 CORS 中间件 - 根据环境使用不同的配置
if ENVIRONMENT == "production":
    # 生产环境 - 严格的CORS配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[FRONTEND_URL],  # 只允许前端域名
        allow_credentials=False,  # 不要求凭证
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # 明确指定允许的方法
        allow_headers=["Authorization", "Content-Type"],  # 明确指定允许的头部
        expose_headers=["Content-Type"]  # 明确指定暴露的头部
    )
    print(f"Running in production mode. CORS configured for: {FRONTEND_URL}")
else:
    # 开发环境 - 宽松的CORS配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 允许所有来源
        allow_credentials=False,  # 不要求凭证
        allow_methods=["*"],  # 允许所有方法
        allow_headers=["*"],  # 允许所有头部
        expose_headers=["*"]  # 暴露所有头部
    )
    print("Running in development mode. CORS configured for all origins.")

# 健康检查路由
@app.get("/api/health")
def health_check():
    """健康检查接口，用于监控系统是否正常运行"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(plans.router, prefix="/api/plans", tags=["plans"])
app.include_router(achievements.router, prefix="/api/achievements", tags=["achievements"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])
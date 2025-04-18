# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, tasks, plans, achievements,statistics
from .database import engine
from .models import Base

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # 替换为你的前端开发服务器地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(plans.router, prefix="/api/plans", tags=["plans"])
app.include_router(achievements.router, prefix="/api/achievements", tags=["achievements"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])
# backend/app/modules/study/routers/__init__.py
"""
学习追踪系统的路由
"""

from fastapi import APIRouter

study_router = APIRouter(prefix="/study")

# 导入路由处理函数
from app.modules.study.routers.tasks import router as tasks_router
from app.modules.study.routers.plans import router as plans_router
from app.modules.study.routers.achievements import router as achievements_router
from app.modules.study.routers.statistics import router as statistics_router

# 注册子路由
study_router.include_router(tasks_router)
study_router.include_router(plans_router)
study_router.include_router(achievements_router)
study_router.include_router(statistics_router)

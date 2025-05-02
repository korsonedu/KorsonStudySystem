# backend/app/modules/course/routers/__init__.py
"""
课程系统的路由
"""

from fastapi import APIRouter

course_router = APIRouter(prefix="/courses", tags=["courses"])

# 未来将导入课程系统的路由处理函数
# from app.modules.course.routers.courses import *
# from app.modules.course.routers.lessons import *
# from app.modules.course.routers.progress import *

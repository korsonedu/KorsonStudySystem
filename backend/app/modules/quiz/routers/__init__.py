# backend/app/modules/quiz/routers/__init__.py
"""
题库系统的路由
"""

from fastapi import APIRouter

quiz_router = APIRouter(prefix="/quiz", tags=["quiz"])

# 未来将导入题库系统的路由处理函数
# from app.modules.quiz.routers.questions import *
# from app.modules.quiz.routers.answers import *
# from app.modules.quiz.routers.attempts import *

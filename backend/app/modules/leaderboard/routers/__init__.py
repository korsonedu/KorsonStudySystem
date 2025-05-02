# backend/app/modules/leaderboard/routers/__init__.py
"""
排行榜系统的路由
"""

from fastapi import APIRouter

leaderboard_router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

# 未来将导入排行榜系统的路由处理函数
# from app.modules.leaderboard.routers.rankings import *
# from app.modules.leaderboard.routers.scores import *

# backend/app/modules/common/routers/__init__.py
"""
公共模块的路由
"""

from fastapi import APIRouter

common_router = APIRouter(tags=["auth"])

# 导入路由处理函数
from app.modules.common.routers.auth import *

# backend/app/auth.py
# 兼容层，重定向到新的模块化结构
# 这个文件只是为了保持向后兼容性，新代码应该直接使用模块化结构

# 从新的模块导入所需的函数和类
from app.modules.common.routers.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_active_user,
    oauth2_scheme
)

# 导入必要的模块
from app.modules.common.models.user import User
from fastapi import Depends, HTTPException

# 以下函数已经从新的模块导入，这里只保留一个未导入的函数

async def get_current_superuser(current_user: User = Depends(get_current_user)):
    """
    检查当前用户是否是超级用户
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user
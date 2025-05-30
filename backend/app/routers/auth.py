# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.modules.common.models import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse
from app.auth import verify_password, create_access_token, get_current_active_user, get_password_hash
from app.database import get_db
from datetime import timedelta
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from app.services.email import send_verification_email
import logging
import httpx
import base64
from urllib.parse import urlencode

# 配置日志
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """用户登录接口，返回JWT令牌"""
    # 查找用户
    user = db.query(User).filter(User.username == form_data.username).first()

    # 验证用户名和密码
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码不正确",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 检查用户是否激活
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户未激活",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 强制检查用户邮箱是否已验证 - 如果有邮箱但未验证，则不允许登录
    if user.email and not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱未验证，请检查您的邮箱并点击验证链接",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # 返回令牌和用户信息
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "email_verified": user.email_verified,
            "avatar": user.avatar  # 返回数据库中存储的头像URL
        }
    }

@router.get("/me", response_model=dict)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """获取当前登录用户信息"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "email_verified": current_user.email_verified,
        "avatar": current_user.avatar  # 添加头像字段
    }

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """用户注册接口"""
    # 检查用户名是否已存在
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被注册"
        )

    # 检查邮箱是否已存在
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )

    # 创建新用户
    hashed_password = get_password_hash(user_data.password)
    
    # 生成默认头像（只在没有提供头像时）
    avatar_data = None
    if not user_data.avatar:
        try:
            avatar_style = ["pixel-art", "lorelei", "micah", "bottts", "identicon", "shapes"][hash(user_data.username) % 6]
            dicebear_url = f"https://api.dicebear.com/7.x/{avatar_style}/svg?seed={user_data.username}"
            
            # 获取SVG数据
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(dicebear_url)
                if response.status_code == 200:
                    svg_content = response.text
                    # 转换为data URL
                    base64_content = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
                    avatar_data = f"data:image/svg+xml;base64,{base64_content}"
        except Exception as e:
            logger.error(f"生成默认头像失败: {str(e)}")
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hashed_password,
        is_active=True,
        is_superuser=False,
        email_verified=False,  # 确保新用户的邮箱验证状态为False
        avatar=user_data.avatar or avatar_data  # 使用提供的头像或默认头像
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 发送验证邮件
    email_sent = False
    if user_data.email:
        try:
            # 直接发送邮件，而不是使用后台任务，以便捕获错误
            email_sent = send_verification_email(
                user_email=new_user.email,
                username=new_user.username,
                user_id=new_user.id
            )

            if not email_sent:
                # 记录邮件发送失败，但不影响用户注册
                logger.warning(f"验证邮件发送失败: {new_user.email}")
        except Exception as e:
            logger.error(f"发送验证邮件时出错: {str(e)}")
            # 不影响用户注册流程，但记录错误

    # 返回用户信息
    return new_user

@router.post("/verify-email")
async def verify_email(token_data: dict, db: Session = Depends(get_db)):
    """邮箱验证接口"""
    try:
        # 验证令牌
        token = token_data.get("token")
        if not token:
            raise HTTPException(status_code=400, detail="缺少验证令牌")

        # 解码令牌获取用户ID
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError as e:
            logger.error(f"JWT解码错误: {str(e)}")
            raise HTTPException(status_code=400, detail="验证令牌无效或已过期")

        # 检查令牌类型
        token_type = payload.get("type")
        if token_type != "email_verification":
            logger.warning(f"无效的令牌类型: {token_type}")
            raise HTTPException(status_code=400, detail="无效的验证令牌类型")

        user_id = payload.get("sub")
        if not user_id:
            logger.warning("令牌中缺少用户ID")
            raise HTTPException(status_code=400, detail="无效的验证令牌")

        # 更新用户邮箱验证状态
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"用户不存在: {user_id}")
            raise HTTPException(status_code=404, detail="用户不存在")

        # 如果已经验证过，直接返回成功
        if user.email_verified:
            return {"status": "success", "message": "邮箱已验证"}

        # 更新验证状态
        user.email_verified = True
        db.commit()
        logger.info(f"用户 {user.username} (ID: {user.id}) 邮箱验证成功")

        return {"status": "success", "message": "邮箱验证成功"}
    except Exception as e:
        logger.error(f"邮箱验证过程中出错: {str(e)}")
        raise HTTPException(status_code=500, detail="验证过程中出错，请稍后再试")

@router.post("/resend-verification")
async def resend_verification(email: str = Body(...), db: Session = Depends(get_db)):
    """重新发送邮箱验证邮件"""
    # 查找用户
    user = db.query(User).filter(User.email == email).first()

    # 不管用户是否存在，都返回相同的消息，避免泄露用户信息
    if not user:
        logger.info(f"尝试重新发送验证邮件到不存在的邮箱: {email}")
        return {"message": "如果邮箱存在，验证邮件已发送"}

    # 如果邮箱已验证，返回提示
    if user.email_verified:
        logger.info(f"尝试重新发送验证邮件到已验证的邮箱: {email}")
        return {"message": "邮箱已验证，无需重新发送"}

    # 直接发送验证邮件
    try:
        email_sent = send_verification_email(
            user_email=user.email,
            username=user.username,
            user_id=user.id
        )

        if email_sent:
            logger.info(f"重新发送验证邮件成功: {email}")
            return {"message": "验证邮件已发送，请检查您的邮箱"}
        else:
            logger.warning(f"重新发送验证邮件失败: {email}")
            return {"message": "验证邮件发送失败，请稍后再试"}
    except Exception as e:
        logger.error(f"重新发送验证邮件时出错: {str(e)}")
        return {"message": "验证邮件发送失败，请稍后再试"}

@router.post("/logout")
async def logout():
    """用户登出接口(前端删除令牌即可)"""
    return {"message": "登出成功"}

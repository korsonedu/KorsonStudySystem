from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse, EmailVerification
from app.models.user import User
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_password_hash, verify_password, create_access_token
import secrets
from app.services.email import EmailService

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    # 验证邀请码
    if user.invitation_code != "korsonacademy":
        raise HTTPException(
            status_code=400,
            detail="邀请码不正确"
        )

    # 检查用户名是否已存在
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # 检查邮箱是否已存在
    db_user_by_email = db.query(User).filter(User.email == user.email).first()
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 生成验证令牌
    verification_token = secrets.token_urlsafe(32)

    # 创建新用户，包括验证令牌
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        verification_token=verification_token,
        email_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 获取基础URL
    base_url = str(request.base_url).rstrip('/')

    # 发送验证邮件
    EmailService.send_verification_email(
        to_email=user.email,
        username=user.username,
        verification_token=verification_token,
        base_url=base_url
    )

    return db_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # 检查用户邮箱是否已验证
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email before logging in.")

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/verify-email", response_model=UserResponse)
def verify_email(verification: EmailVerification, db: Session = Depends(get_db)):
    # 查找具有该验证令牌的用户
    user = db.query(User).filter(User.verification_token == verification.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    # 如果用户已经验证过邮箱，则返回成功
    if user.email_verified:
        return user

    # 更新用户的邮箱验证状态
    user.email_verified = True
    user.verification_token = None  # 清除验证令牌，防止重复使用
    db.commit()
    db.refresh(user)

    return user

@router.get("/verify-email", include_in_schema=False)
def verify_email_redirect(token: str, request: Request):
    """
    处理GET请求的验证链接，重定向到前端验证页面
    """
    # 从请求中提取协议和主机部分
    import re
    base_url = str(request.base_url).rstrip('/')
    protocol_host_match = re.match(r'(https?://[^:/]+)(:\d+)?', base_url)

    if protocol_host_match:
        protocol_host = protocol_host_match.group(1)
        # 假设前端运行在5173端口
        frontend_url = f"{protocol_host}:5173"
    else:
        # 如果无法解析，则使用默认的前端URL
        frontend_url = "http://localhost:5173"

    # 重定向到前端验证页面
    from fastapi.responses import RedirectResponse
    redirect_url = f"{frontend_url}/verify-email?token={token}"
    return RedirectResponse(url=redirect_url)

@router.post("/resend-verification", response_model=dict)
def resend_verification(email: str, request: Request, db: Session = Depends(get_db)):
    # 查找具有该邮箱的用户
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email not found")

    # 如果用户已经验证过邮箱，则返回成功
    if user.email_verified:
        return {"message": "Email already verified"}

    # 生成新的验证令牌
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = verification_token
    db.commit()

    # 获取基础URL
    base_url = str(request.base_url).rstrip('/')

    # 发送验证邮件
    EmailService.send_verification_email(
        to_email=user.email,
        username=user.username,
        verification_token=verification_token,
        base_url=base_url
    )

    return {"message": "Verification email sent"}


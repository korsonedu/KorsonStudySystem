from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse, EmailVerification
from app.models.user import User
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_password_hash, verify_password, create_access_token
import secrets

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
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
    from app.services.email import EmailService
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

    # 检查邮箱是否已验证
    if user.email and not user.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email not verified. Please check your email for verification link."
        )

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
    from app.services.email import EmailService
    EmailService.send_verification_email(
        to_email=user.email,
        username=user.username,
        verification_token=verification_token,
        base_url=base_url
    )

    return {"message": "Verification email sent"}


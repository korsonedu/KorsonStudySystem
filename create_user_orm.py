import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal
from backend.app.modules.common.models.user import User
from passlib.context import CryptContext

# 密码哈希工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 新用户信息
username = "admin"
password = "admin123"  # 简单密码，仅用于测试
email = "admin@example.com"

# 生成密码哈希
hashed_password = pwd_context.hash(password)

try:
    # 创建数据库会话
    db = SessionLocal()
    
    # 检查用户是否已存在
    existing_user = db.query(User).filter(User.username == username).first()
    
    if existing_user:
        print(f"User '{username}' already exists")
    else:
        # 创建新用户
        new_user = User(
            username=username,
            email=email,
            password=hashed_password,
            is_active=True,
            is_superuser=False,
            email_verified=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"User '{username}' created successfully with password '{password}'")
        print(f"User ID: {new_user.id}")
    
    # 关闭会话
    db.close()
    
except Exception as e:
    print(f"Error: {e}")

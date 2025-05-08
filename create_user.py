import os
import sys
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# 数据库连接URL
DATABASE_URL = "postgresql://dbuser:gyc050216@localhost:5432/KorsonStudySystem"

# 密码哈希工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 新用户信息
username = "admin"
password = "admin123"  # 简单密码，仅用于测试
email = "admin@example.com"

# 生成密码哈希
hashed_password = pwd_context.hash(password)

try:
    # 创建数据库引擎
    engine = create_engine(DATABASE_URL)
    
    # 连接数据库
    with engine.connect() as conn:
        # 检查用户是否已存在
        result = conn.execute(text("SELECT * FROM common_users WHERE username = :username"), {"username": username})
        user = result.fetchone()
        
        if user:
            print(f"User '{username}' already exists")
        else:
            # 创建新用户，不指定ID，让数据库自动分配
            conn.execute(
                text("""
                INSERT INTO common_users (username, email, password, is_active, is_superuser, created_at, email_verified)
                VALUES (:username, :email, :password, true, false, NOW(), true)
                """),
                {
                    "username": username,
                    "email": email,
                    "password": hashed_password
                }
            )
            conn.commit()
            print(f"User '{username}' created successfully with password '{password}'")
            
except Exception as e:
    print(f"Error: {e}")

import os
import sys
import psycopg2
from passlib.context import CryptContext

# 数据库连接参数
DB_PARAMS = {
    "dbname": "KorsonStudySystem",
    "user": "dbuser",
    "password": "gyc050216",
    "host": "localhost",
    "port": "5432"
}

# 密码哈希工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 新用户信息
username = "admin"
password = "admin123"  # 简单密码，仅用于测试
email = "admin@example.com"

# 生成密码哈希
hashed_password = pwd_context.hash(password)

try:
    # 连接数据库
    conn = psycopg2.connect(**DB_PARAMS)
    cursor = conn.cursor()
    
    # 检查用户是否已存在
    cursor.execute("SELECT * FROM common_users WHERE username = %s", (username,))
    user = cursor.fetchone()
    
    if user:
        print(f"User '{username}' already exists")
    else:
        # 获取下一个可用的ID
        cursor.execute("SELECT MAX(id) FROM common_users")
        max_id = cursor.fetchone()[0]
        next_id = (max_id or 0) + 1
        
        # 创建新用户
        cursor.execute("""
            INSERT INTO common_users (id, username, email, password, is_active, is_superuser, created_at, email_verified)
            VALUES (%s, %s, %s, %s, true, false, NOW(), true)
        """, (next_id, username, email, hashed_password))
        
        conn.commit()
        print(f"User '{username}' created successfully with password '{password}'")
        print(f"User ID: {next_id}")
    
    # 关闭连接
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")

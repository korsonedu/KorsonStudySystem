import os
import sys
from sqlalchemy import create_engine, text

# 数据库连接URL
DATABASE_URL = "postgresql://dbuser:gyc050216@localhost:5432/KorsonStudySystem"

try:
    # 创建数据库引擎
    engine = create_engine(DATABASE_URL)
    
    # 连接数据库
    with engine.connect() as conn:
        # 查询用户表
        result = conn.execute(text("SELECT id, username, email FROM common_users ORDER BY id"))
        users = [dict(row._mapping) for row in result]
        
        print("用户表数据:")
        for user in users:
            print(f"ID: {user['id']}, 用户名: {user['username']}, 邮箱: {user['email']}")
        
        # 查询序列当前值
        result = conn.execute(text("SELECT last_value FROM common_users_id_seq"))
        seq_value = result.scalar()
        print(f"\n序列当前值: {seq_value}")
        
        # 查询最大ID
        result = conn.execute(text("SELECT MAX(id) FROM common_users"))
        max_id = result.scalar()
        print(f"最大ID值: {max_id}")
        
except Exception as e:
    print(f"Error: {e}")

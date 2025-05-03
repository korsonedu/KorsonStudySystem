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
        # 检查表是否存在
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result]
        print("Tables in database:", tables)
        
        # 检查用户表是否存在
        if 'common_users' in tables:
            # 查询用户表
            result = conn.execute(text("SELECT * FROM common_users"))
            users = [dict(row._mapping) for row in result]
            print("\nUsers in database:", users)
        else:
            print("\nNo common_users table found")
            
except Exception as e:
    print(f"Error: {e}")

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
        # 查询最大ID
        result = conn.execute(text("SELECT MAX(id) FROM common_users"))
        max_id = result.scalar()
        print(f"当前最大ID值: {max_id}")
        
        # 重置序列值为最大ID + 1
        new_seq_value = max_id + 1
        conn.execute(text(f"ALTER SEQUENCE common_users_id_seq RESTART WITH {new_seq_value}"))
        conn.commit()
        print(f"序列值已重置为: {new_seq_value}")
        
        # 验证序列值
        result = conn.execute(text("SELECT last_value FROM common_users_id_seq"))
        seq_value = result.scalar()
        print(f"更新后的序列值: {seq_value}")
        
except Exception as e:
    print(f"Error: {e}")

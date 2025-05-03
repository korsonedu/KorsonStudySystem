import os
import sys
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# 数据库连接URL
DATABASE_URL = "postgresql://dbuser:gyc050216@localhost:5432/KorsonStudySystem"

# 密码哈希工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 验证密码
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 生成密码哈希
def get_password_hash(password):
    return pwd_context.hash(password)

try:
    # 创建数据库引擎
    engine = create_engine(DATABASE_URL)
    
    # 连接数据库
    with engine.connect() as conn:
        # 查询所有用户
        result = conn.execute(text("SELECT id, username, email, password FROM common_users"))
        users = [dict(row._mapping) for row in result]
        
        print(f"数据库中的用户数量: {len(users)}")
        
        for user in users:
            print(f"\n用户ID: {user['id']}")
            print(f"用户名: {user['username']}")
            print(f"邮箱: {user['email']}")
            print(f"密码哈希: {user['password']}")
            
            # 测试密码
            test_passwords = ["admin123", "password", "123456", "testpassword", "korsonacademy"]
            for test_password in test_passwords:
                try:
                    is_valid = verify_password(test_password, user['password'])
                    print(f"密码 '{test_password}' 验证结果: {is_valid}")
                except Exception as e:
                    print(f"密码 '{test_password}' 验证出错: {e}")
            
        # 如果命令行提供了用户名和密码，则尝试验证
        if len(sys.argv) > 2:
            username = sys.argv[1]
            password = sys.argv[2]
            
            # 查询指定用户
            result = conn.execute(
                text("SELECT id, username, email, password FROM common_users WHERE username = :username"),
                {"username": username}
            )
            user = result.fetchone()
            
            if user:
                user_dict = dict(user._mapping)
                print(f"\n验证用户 '{username}' 的密码 '{password}':")
                try:
                    is_valid = verify_password(password, user_dict['password'])
                    print(f"验证结果: {is_valid}")
                except Exception as e:
                    print(f"验证出错: {e}")
            else:
                print(f"\n用户 '{username}' 不存在")
                
except Exception as e:
    print(f"Error: {e}")

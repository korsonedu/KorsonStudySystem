from passlib.context import CryptContext
import sys

# 密码哈希工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 生成密码哈希
def get_password_hash(password):
    return pwd_context.hash(password)

# 验证密码
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 测试密码哈希和验证
def test_password():
    # 测试密码
    password = "admin123"
    
    # 生成哈希
    hashed_password = get_password_hash(password)
    print(f"原始密码: {password}")
    print(f"哈希密码: {hashed_password}")
    
    # 验证密码
    is_valid = verify_password(password, hashed_password)
    print(f"密码验证结果: {is_valid}")
    
    # 验证错误密码
    wrong_password = "wrongpassword"
    is_valid = verify_password(wrong_password, hashed_password)
    print(f"错误密码验证结果: {is_valid}")

if __name__ == "__main__":
    test_password()
    
    # 如果提供了哈希密码作为参数，则验证指定密码
    if len(sys.argv) > 2:
        stored_hash = sys.argv[1]
        test_password = sys.argv[2]
        is_valid = verify_password(test_password, stored_hash)
        print(f"\n验证指定密码 '{test_password}' 结果: {is_valid}")

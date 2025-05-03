import requests
import sys

# API 端点
API_URL = "http://localhost:8000/api/auth/token"

def test_login(username, password):
    """测试登录 API"""
    # 准备表单数据
    data = {
        "username": username,
        "password": password
    }
    
    # 发送请求
    print(f"尝试登录用户: {username}")
    print(f"请求 URL: {API_URL}")
    print(f"请求数据: {data}")
    
    try:
        response = requests.post(API_URL, data=data)
        
        # 打印响应
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        # 如果成功，打印令牌
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"访问令牌: {token[:20]}...")
            return True
        else:
            print("登录失败")
            return False
    except Exception as e:
        print(f"请求出错: {e}")
        return False

if __name__ == "__main__":
    # 如果提供了命令行参数，使用它们作为用户名和密码
    if len(sys.argv) > 2:
        username = sys.argv[1]
        password = sys.argv[2]
    else:
        # 否则使用默认值
        username = "admin"
        password = "admin123"
    
    test_login(username, password)

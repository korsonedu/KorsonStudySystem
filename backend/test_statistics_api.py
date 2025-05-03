#!/usr/bin/env python
"""
统计API测试脚本
用于测试所有统计API端点是否正常工作
"""

import requests
import json
from pprint import pprint
import argparse
import sys

# 配置
BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6MTc0NjM3MDkzOX0.-NRRmdAg-4HhiKn6NJz-7KJ-P3wP9_3Qc5xjvdemun8"

# 统计API端点
ENDPOINTS = [
    "/api/study/statistics",
    "/api/study/statistics/daily",
    "/api/study/statistics/weekly", 
    "/api/study/statistics/monthly",
    "/api/study/statistics/heatmap",
    "/api/study/statistics/time-distribution",
    "/api/study/statistics/user"
]

# 无需认证的端点
NOAUTH_ENDPOINTS = [
    "/api/health",
    "/docs",
    "/redoc",
    "/openapi.json"
]

def test_endpoint(endpoint, use_token=True):
    """测试单个端点"""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    if use_token:
        headers["Authorization"] = f"Bearer {TOKEN}"
    
    print(f"\n===== 测试: {endpoint} =====")
    try:
        response = requests.get(url, headers=headers)
        status_code = response.status_code
        print(f"状态码: {status_code}")
        
        if status_code == 200:
            try:
                data = response.json()
                print("响应数据:")
                pprint(data)
            except json.JSONDecodeError:
                print("响应不是JSON格式:")
                print(response.text[:500])  # 只显示前500个字符
            return True
        else:
            print(f"错误响应: {response.text}")
            return False
    except Exception as e:
        print(f"请求失败: {str(e)}")
        return False

def main():
    """测试所有统计API端点"""
    parser = argparse.ArgumentParser(description='测试统计API端点')
    parser.add_argument('--no-auth', action='store_true', help='测试无需认证的端点')
    args = parser.parse_args()
    
    if args.no_auth:
        print("开始测试无需认证的API...")
        endpoints = NOAUTH_ENDPOINTS
        use_token = False
    else:
        print("开始测试统计API...")
        endpoints = ENDPOINTS
        use_token = True
        
        if TOKEN == "这里填入你的token":
            print("错误: 请先在脚本中设置有效的令牌")
            print("提示: 从浏览器开发者工具中获取令牌")
            sys.exit(1)
    
    # 测试所有端点
    results = {}
    for endpoint in endpoints:
        success = test_endpoint(endpoint, use_token)
        results[endpoint] = "成功" if success else "失败"
    
    # 打印结果摘要
    print("\n===== 测试结果摘要 =====")
    for endpoint, result in results.items():
        print(f"{endpoint}: {result}")

if __name__ == "__main__":
    main() 
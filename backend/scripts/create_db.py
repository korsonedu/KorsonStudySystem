#!/usr/bin/env python
"""
数据库创建脚本
用于创建KorsonStudySystem数据库并授予权限
"""

import os
import sys
import logging
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入配置
from app.config import DATABASE_URL

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_database():
    """创建数据库并授予权限"""
    # 解析数据库URL
    db_parts = DATABASE_URL.split('/')
    db_name = db_parts[-1]
    db_connection = '/'.join(db_parts[:-1]) + '/postgres'
    
    # 提取用户名
    user_parts = db_parts[2].split(':')
    username = user_parts[0]
    
    logger.info(f"准备创建数据库: {db_name}")
    logger.info(f"连接到: {db_connection}")
    
    try:
        # 连接到默认的postgres数据库
        conn = psycopg2.connect(db_connection)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # 检查数据库是否已存在
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
        exists = cursor.fetchone()
        
        if not exists:
            # 创建数据库
            logger.info(f"创建数据库: {db_name}")
            cursor.execute(f"CREATE DATABASE \"{db_name}\"")
            
            # 授予权限
            logger.info(f"授予用户 {username} 对数据库 {db_name} 的所有权限")
            cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE \"{db_name}\" TO {username}")
            
            logger.info(f"数据库 {db_name} 创建成功")
        else:
            logger.info(f"数据库 {db_name} 已存在")
        
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        logger.error(f"创建数据库时出错: {str(e)}")
        return False

if __name__ == "__main__":
    create_database()

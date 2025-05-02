#!/usr/bin/env python
"""
清理旧表
在确认新表正常工作后，可以运行此脚本删除旧表
"""

import os
import sys
import logging
from sqlalchemy import text

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入数据库
from app.database import engine

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 旧表列表
OLD_TABLES = ['users', 'tasks', 'plans', 'achievements']

def cleanup_old_tables():
    """清理旧表"""
    try:
        logger.info("开始清理旧表...")
        
        with engine.connect() as conn:
            for table in OLD_TABLES:
                logger.info(f"删除表 {table}...")
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                    logger.info(f"表 {table} 已删除")
                except Exception as e:
                    logger.error(f"删除表 {table} 时出错: {str(e)}")
            
            # 提交事务
            conn.commit()
        
        logger.info("旧表清理完成！")
        return True
    except Exception as e:
        logger.error(f"清理旧表时出错: {str(e)}")
        return False

if __name__ == "__main__":
    # 确认提示
    confirm = input("警告：此操作将删除旧表，数据将无法恢复。是否继续？(y/n): ")
    if confirm.lower() == 'y':
        cleanup_old_tables()
    else:
        logger.info("操作已取消")

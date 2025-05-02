#!/usr/bin/env python
"""
验证数据库结构
"""

import os
import sys
import logging
from sqlalchemy import inspect

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入数据库和模型
from app.database import engine
from app.config import TABLE_PREFIX

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def verify_database():
    """验证数据库结构"""
    try:
        logger.info("开始验证数据库结构...")
        
        # 获取数据库检查器
        inspector = inspect(engine)
        
        # 获取所有表名
        tables = inspector.get_table_names()
        logger.info(f"数据库中的表: {tables}")
        
        # 验证表前缀
        common_tables = [table for table in tables if table.startswith(TABLE_PREFIX['COMMON'])]
        study_tables = [table for table in tables if table.startswith(TABLE_PREFIX['STUDY'])]
        
        logger.info(f"公共表: {common_tables}")
        logger.info(f"学习追踪系统表: {study_tables}")
        
        # 验证用户表
        if f"{TABLE_PREFIX['COMMON']}users" in tables:
            columns = [column['name'] for column in inspector.get_columns(f"{TABLE_PREFIX['COMMON']}users")]
            logger.info(f"用户表列: {columns}")
        else:
            logger.error(f"用户表 {TABLE_PREFIX['COMMON']}users 不存在!")
        
        # 验证任务表
        if f"{TABLE_PREFIX['STUDY']}tasks" in tables:
            columns = [column['name'] for column in inspector.get_columns(f"{TABLE_PREFIX['STUDY']}tasks")]
            logger.info(f"任务表列: {columns}")
        else:
            logger.error(f"任务表 {TABLE_PREFIX['STUDY']}tasks 不存在!")
        
        # 验证计划表
        if f"{TABLE_PREFIX['STUDY']}plans" in tables:
            columns = [column['name'] for column in inspector.get_columns(f"{TABLE_PREFIX['STUDY']}plans")]
            logger.info(f"计划表列: {columns}")
        else:
            logger.error(f"计划表 {TABLE_PREFIX['STUDY']}plans 不存在!")
        
        # 验证成就表
        if f"{TABLE_PREFIX['STUDY']}achievements" in tables:
            columns = [column['name'] for column in inspector.get_columns(f"{TABLE_PREFIX['STUDY']}achievements")]
            logger.info(f"成就表列: {columns}")
        else:
            logger.error(f"成就表 {TABLE_PREFIX['STUDY']}achievements 不存在!")
        
        logger.info("数据库结构验证完成！")
        return True
    except Exception as e:
        logger.error(f"验证数据库结构时出错: {str(e)}")
        return False

if __name__ == "__main__":
    verify_database()

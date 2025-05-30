#!/usr/bin/env python
"""
数据库初始化脚本
用于创建数据库表结构并添加初始数据
"""

import os
import sys
import logging
from sqlalchemy_utils import database_exists, create_database
from sqlalchemy import inspect, text

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入数据库配置和模型
from app.database import engine, Base
from app.core.config import DATABASE_URL, TABLE_PREFIX
from app.modules.common.models.user import User
from app.modules.study.models.task import Task
from app.modules.study.models.plan import Plan
from app.modules.study.models.achievement import Achievement

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def init_database():
    """初始化数据库"""
    try:
        # 检查数据库是否存在，如果不存在则创建
        if not database_exists(engine.url):
            logger.info(f"数据库不存在，正在创建...")
            create_database(engine.url)
            logger.info(f"数据库创建成功!")
        else:
            logger.info(f"数据库已存在，跳过创建步骤")
        
        # 创建所有表
        logger.info("正在创建数据库表...")
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功!")
        
        # 检查表是否存在
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # 检查用户表
        user_table = f"{TABLE_PREFIX['COMMON']}users"
        if user_table in tables:
            logger.info(f"用户表 '{user_table}' 已存在")
            
            # 检查avatar字段是否存在
            columns = [col['name'] for col in inspector.get_columns(user_table)]
            if 'avatar' in columns:
                logger.info("avatar字段已存在于用户表中")
            else:
                logger.warning("avatar字段不存在于用户表中，请运行数据库迁移")
        else:
            logger.warning(f"用户表 '{user_table}' 不存在，请检查表创建是否成功")
        
        # 检查其他表
        task_table = f"{TABLE_PREFIX['STUDY']}tasks"
        plan_table = f"{TABLE_PREFIX['STUDY']}plans"
        achievement_table = f"{TABLE_PREFIX['STUDY']}achievements"
        
        for table_name in [task_table, plan_table, achievement_table]:
            if table_name in tables:
                logger.info(f"表 '{table_name}' 已存在")
            else:
                logger.warning(f"表 '{table_name}' 不存在，请检查表创建是否成功")
        
        return True
    
    except Exception as e:
        logger.error(f"初始化数据库时出错: {str(e)}")
        return False

def check_table_columns():
    """检查表的列信息"""
    try:
        inspector = inspect(engine)
        
        # 检查用户表的列
        user_table = f"{TABLE_PREFIX['COMMON']}users"
        logger.info(f"\n{user_table} 表的列信息:")
        for column in inspector.get_columns(user_table):
            logger.info(f"  - {column['name']}: {column['type']}")
        
        # 检查任务表的列
        task_table = f"{TABLE_PREFIX['STUDY']}tasks"
        logger.info(f"\n{task_table} 表的列信息:")
        for column in inspector.get_columns(task_table):
            logger.info(f"  - {column['name']}: {column['type']}")
        
        # 检查计划表的列
        plan_table = f"{TABLE_PREFIX['STUDY']}plans"
        logger.info(f"\n{plan_table} 表的列信息:")
        for column in inspector.get_columns(plan_table):
            logger.info(f"  - {column['name']}: {column['type']}")
        
        # 检查成就表的列
        achievement_table = f"{TABLE_PREFIX['STUDY']}achievements"
        logger.info(f"\n{achievement_table} 表的列信息:")
        for column in inspector.get_columns(achievement_table):
            logger.info(f"  - {column['name']}: {column['type']}")
        
        return True
    
    except Exception as e:
        logger.error(f"检查表列信息时出错: {str(e)}")
        return False

def add_avatar_column_manually():
    """手动添加avatar列（如果迁移失败可以使用此方法）"""
    try:
        user_table = f"{TABLE_PREFIX['COMMON']}users"
        inspector = inspect(engine)
        
        # 检查avatar字段是否已存在
        columns = [col['name'] for col in inspector.get_columns(user_table)]
        if 'avatar' in columns:
            logger.info("avatar字段已存在，无需添加")
            return True
        
        # 手动添加avatar列
        logger.info(f"正在手动添加avatar列到 {user_table} 表...")
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {user_table} ADD COLUMN avatar TEXT"))
            conn.commit()
        
        logger.info("avatar列添加成功!")
        return True
    
    except Exception as e:
        logger.error(f"手动添加avatar列时出错: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="数据库初始化工具")
    parser.add_argument("--init", action="store_true", help="初始化数据库和表")
    parser.add_argument("--check", action="store_true", help="检查表的列信息")
    parser.add_argument("--add-avatar", action="store_true", help="手动添加avatar列")
    
    args = parser.parse_args()
    
    if args.init:
        init_database()
    elif args.check:
        check_table_columns()
    elif args.add_avatar:
        add_avatar_column_manually()
    else:
        parser.print_help()

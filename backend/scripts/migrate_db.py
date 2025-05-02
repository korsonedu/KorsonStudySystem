#!/usr/bin/env python
"""
数据库迁移脚本
用于将现有数据从旧表结构迁移到新表结构
"""

import os
import sys
import logging
from sqlalchemy import create_engine, MetaData, Table, select, insert
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入配置
from app.config import DATABASE_URL, TABLE_PREFIX

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 旧数据库URL（使用旧的数据库名）
OLD_DATABASE_URL = DATABASE_URL.replace("KorsonStudySystem", "learning_tracker")

# 创建数据库引擎
old_engine = create_engine(OLD_DATABASE_URL)
new_engine = create_engine(DATABASE_URL)

# 创建元数据对象
old_metadata = MetaData()
new_metadata = MetaData()

# 定义旧表和新表的映射关系
table_mappings = {
    "users": f"{TABLE_PREFIX['COMMON']}users",
    "tasks": f"{TABLE_PREFIX['STUDY']}tasks",
    "plans": f"{TABLE_PREFIX['STUDY']}plans",
    "achievements": f"{TABLE_PREFIX['STUDY']}achievements"
}

def migrate_table(old_table_name, new_table_name):
    """迁移单个表的数据"""
    logger.info(f"开始迁移表 {old_table_name} -> {new_table_name}")

    try:
        # 反射表结构
        old_table = Table(old_table_name, old_metadata, autoload_with=old_engine)

        # 检查新表是否存在，如果不存在则创建
        if not new_engine.dialect.has_table(new_engine.connect(), new_table_name):
            logger.warning(f"新表 {new_table_name} 不存在，将尝试创建")
            # 这里我们不创建表，因为应该由模型定义创建
            logger.error(f"新表 {new_table_name} 不存在，请先运行应用创建表结构")
            return

        new_table = Table(new_table_name, new_metadata, autoload_with=new_engine)

        # 创建会话
        OldSession = sessionmaker(bind=old_engine)
        NewSession = sessionmaker(bind=new_engine)

        old_session = OldSession()
        new_session = NewSession()

        try:
            # 先清空新表中的数据（如果有）
            new_session.execute(new_table.delete())

            # 查询旧表中的所有数据
            query = select(old_table)
            result = old_session.execute(query).fetchall()

            # 如果有数据，则插入到新表
            if result:
                # 获取新表和旧表的列名
                new_columns = [c.name for c in new_table.columns]

                for row in result:
                    # 将行转换为字典
                    row_dict = {column.name: value for column, value in zip(old_table.columns, row)}

                    # 只保留新表中存在的列
                    filtered_row_dict = {k: v for k, v in row_dict.items() if k in new_columns}

                    # 插入到新表
                    stmt = insert(new_table).values(**filtered_row_dict)
                    new_session.execute(stmt)

                # 提交事务
                new_session.commit()
                logger.info(f"成功迁移 {len(result)} 条记录从 {old_table_name} 到 {new_table_name}")
            else:
                logger.info(f"表 {old_table_name} 中没有数据需要迁移")

        except Exception as e:
            new_session.rollback()
            logger.error(f"迁移表 {old_table_name} 时出错: {str(e)}")

        finally:
            old_session.close()
            new_session.close()

    except Exception as e:
        logger.error(f"反射表 {old_table_name} 结构时出错: {str(e)}")

def check_old_db_exists():
    """检查旧数据库是否存在"""
    try:
        # 尝试连接旧数据库
        engine = create_engine(OLD_DATABASE_URL)
        conn = engine.connect()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"旧数据库不存在或无法连接: {str(e)}")
        return False

def main():
    """主函数"""
    logger.info("开始数据库迁移")

    # 检查旧数据库是否存在
    if not check_old_db_exists():
        logger.warning("旧数据库不存在，跳过迁移")
        return

    # 迁移每个表
    for old_table, new_table in table_mappings.items():
        migrate_table(old_table, new_table)

    logger.info("数据库迁移完成")

if __name__ == "__main__":
    main()

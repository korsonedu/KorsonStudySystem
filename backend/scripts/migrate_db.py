#!/usr/bin/env python
"""
数据库迁移脚本
用于将现有数据从旧表结构迁移到新表结构，并支持头像数据迁移
"""

import os
import sys
import logging
import json
from datetime import datetime
from sqlalchemy import create_engine, MetaData, Table, select, insert, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import httpx
import base64
from urllib.parse import urlencode

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入配置
from app.core.config import DATABASE_URL, TABLE_PREFIX
from app.database import Base, get_db
from app.modules.common.models.user import User

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

    # 反射表结构
    old_table = Table(old_table_name, old_metadata, autoload_with=old_engine)
    new_table = Table(new_table_name, new_metadata, autoload_with=new_engine)

    # 创建会话
    OldSession = sessionmaker(bind=old_engine)
    NewSession = sessionmaker(bind=new_engine)

    old_session = OldSession()
    new_session = NewSession()

    try:
        # 查询旧表中的所有数据
        query = select(old_table)
        result = old_session.execute(query).fetchall()

        # 如果有数据，则插入到新表
        if result:
            for row in result:
                # 将行转换为字典
                row_dict = {column.name: value for column, value in zip(old_table.columns, row)}

                # 插入到新表
                stmt = insert(new_table).values(**row_dict)
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

def migrate_avatar_data():
    """为用户生成并迁移头像数据"""
    try:
        # 创建数据库会话
        NewSession = sessionmaker(bind=new_engine)
        session = NewSession()

        # 检查avatar和avatar_options字段是否存在
        inspector = inspect(new_engine)
        user_table = f"{TABLE_PREFIX['COMMON']}users"
        columns = [col['name'] for col in inspector.get_columns(user_table)]

        if 'avatar' not in columns or 'avatar_options' not in columns:
            logger.error(f"avatar或avatar_options字段不存在于{user_table}表中，请先执行数据库迁移")
            return False

        # 查询所有用户
        users_table = Table(user_table, new_metadata, autoload_with=new_engine)
        query = select(users_table)
        result = session.execute(query).fetchall()

        if not result:
            logger.info("没有找到用户数据，跳过头像迁移")
            return True

        logger.info(f"找到 {len(result)} 个用户需要迁移头像数据")

        # 为每个用户生成默认头像
        updated_count = 0
        for row in result:
            # 将行转换为字典
            user_data = {column.name: value for column, value in zip(users_table.columns, row)}

            # 如果用户没有头像，则生成默认头像
            if 'avatar' in user_data and user_data['avatar'] is None:
                # 生成默认头像
                username = user_data.get('username', f"user_{user_data['id']}")
                avatar_style = ["pixel-art", "lorelei", "micah", "bottts", "identicon", "shapes"][hash(username) % 6]
                
                # 设置头像生成参数
                avatar_options = {
                    "style": avatar_style,
                    "seed": username
                }
                
                try:
                    # 使用httpx获取头像数据
                    with httpx.Client(timeout=10.0) as client:
                        # 构建DiceBear URL
                        params = {"seed": username}
                        dicebear_url = f"https://api.dicebear.com/7.x/{avatar_style}/svg?{urlencode(params)}"
                        
                        # 获取头像
                        response = client.get(dicebear_url)
                        if response.status_code == 200:
                            # 转换为data URL
                            svg_content = response.text
                            base64_content = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
                            avatar_data_url = f"data:image/svg+xml;base64,{base64_content}"

                # 更新用户头像
                            stmt = users_table.update().where(users_table.c.id == user_data['id']).values(
                                avatar=avatar_data_url,
                                avatar_options=avatar_options
                            )
                session.execute(stmt)
                updated_count += 1
                        else:
                            logger.error(f"获取头像失败: {response.text}")
                except Exception as e:
                    logger.error(f"生成头像失败: {str(e)}")

        # 提交更改
        session.commit()
        logger.info(f"成功更新 {updated_count} 个用户的头像")
        return True
    except Exception as e:
        logger.error(f"迁移头像数据时出错: {str(e)}")
        return False

def export_user_data(output_file="user_data_export.json"):
    """导出用户数据到JSON文件"""
    try:
        # 创建数据库会话
        NewSession = sessionmaker(bind=new_engine)
        session = NewSession()

        # 查询所有用户
        user_table = f"{TABLE_PREFIX['COMMON']}users"
        users_table = Table(user_table, new_metadata, autoload_with=new_engine)
        query = select(users_table)
        result = session.execute(query).fetchall()

        if not result:
            logger.info("没有找到用户数据，跳过导出")
            return None

        logger.info(f"找到 {len(result)} 个用户需要导出")

        # 准备导出数据
        export_data = []
        for row in result:
            # 将行转换为字典
            user_data = {column.name: value for column, value in zip(users_table.columns, row)}

            # 处理日期时间字段
            if 'created_at' in user_data and user_data['created_at']:
                user_data['created_at'] = user_data['created_at'].isoformat()

            export_data.append(user_data)

        # 写入JSON文件
        output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), output_file)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

        logger.info(f"用户数据已成功导出到 {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"导出用户数据时出错: {str(e)}")
        return None

    finally:
        if 'session' in locals():
            session.close()

def main():
    """主函数"""
    logger.info("开始数据库迁移")

    # 迁移每个表
    for old_table, new_table in table_mappings.items():
        migrate_table(old_table, new_table)

    # 迁移头像数据
    migrate_avatar_data()

    logger.info("数据库迁移完成")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="数据迁移工具")
    parser.add_argument("--migrate-tables", action="store_true", help="迁移表数据")
    parser.add_argument("--migrate-avatar", action="store_true", help="迁移用户头像数据")
    parser.add_argument("--export", action="store_true", help="导出用户数据到JSON文件")
    parser.add_argument("--file", help="导出文件路径")

    args = parser.parse_args()

    if args.migrate_tables:
        main()
    elif args.migrate_avatar:
        migrate_avatar_data()
    elif args.export:
        export_file = args.file or "user_data_export.json"
        export_user_data(export_file)
    else:
        parser.print_help()

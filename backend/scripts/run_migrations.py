#!/usr/bin/env python
"""
数据库迁移执行脚本
用于自动执行所有待执行的数据库迁移
"""

import os
import sys
import logging
import subprocess
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入配置
from app.core.config import DATABASE_URL

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_migrations():
    """执行所有待执行的数据库迁移"""
    try:
        logger.info("开始执行数据库迁移...")
        
        # 获取项目根目录
        project_root = Path(__file__).parent.parent
        
        # 切换到项目根目录
        os.chdir(project_root)
        
        # 执行数据库迁移
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True
        )
        
        # 输出迁移结果
        logger.info("迁移输出:")
        for line in result.stdout.splitlines():
            logger.info(line)
        
        logger.info("数据库迁移成功完成!")
        return True
    
    except subprocess.CalledProcessError as e:
        logger.error(f"迁移执行失败: {e}")
        logger.error(f"错误输出: {e.stderr}")
        return False
    
    except Exception as e:
        logger.error(f"执行迁移时出错: {str(e)}")
        return False

def check_migration_status():
    """检查当前的迁移状态"""
    try:
        logger.info("检查数据库迁移状态...")
        
        # 获取项目根目录
        project_root = Path(__file__).parent.parent
        
        # 切换到项目根目录
        os.chdir(project_root)
        
        # 执行迁移状态检查
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True,
            check=True
        )
        
        # 输出当前状态
        logger.info("当前迁移版本:")
        for line in result.stdout.splitlines():
            logger.info(line)
        
        # 检查是否有未应用的迁移
        result = subprocess.run(
            ["alembic", "history", "--indicate-current"],
            capture_output=True,
            text=True,
            check=True
        )
        
        logger.info("迁移历史:")
        for line in result.stdout.splitlines():
            logger.info(line)
        
        return True
    
    except subprocess.CalledProcessError as e:
        logger.error(f"检查迁移状态失败: {e}")
        logger.error(f"错误输出: {e.stderr}")
        return False
    
    except Exception as e:
        logger.error(f"检查迁移状态时出错: {str(e)}")
        return False

def create_migration(message):
    """创建新的迁移文件"""
    try:
        logger.info(f"创建新的迁移: {message}...")
        
        # 获取项目根目录
        project_root = Path(__file__).parent.parent
        
        # 切换到项目根目录
        os.chdir(project_root)
        
        # 执行迁移创建
        result = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", message],
            capture_output=True,
            text=True,
            check=True
        )
        
        # 输出创建结果
        logger.info("迁移文件创建输出:")
        for line in result.stdout.splitlines():
            logger.info(line)
        
        logger.info("迁移文件创建成功!")
        return True
    
    except subprocess.CalledProcessError as e:
        logger.error(f"创建迁移文件失败: {e}")
        logger.error(f"错误输出: {e.stderr}")
        return False
    
    except Exception as e:
        logger.error(f"创建迁移文件时出错: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="数据库迁移工具")
    parser.add_argument("--check", action="store_true", help="检查迁移状态")
    parser.add_argument("--create", help="创建新的迁移文件")
    parser.add_argument("--run", action="store_true", help="执行所有待执行的迁移")
    
    args = parser.parse_args()
    
    if args.check:
        check_migration_status()
    elif args.create:
        create_migration(args.create)
    elif args.run:
        run_migrations()
    else:
        parser.print_help()

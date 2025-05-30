#!/usr/bin/env python
"""
数据库备份和恢复脚本
用于备份和恢复PostgreSQL数据库
"""

import os
import sys
import logging
import subprocess
import datetime
import re
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入配置
from app.core.config import DATABASE_URL

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 解析数据库URL
def parse_db_url(url):
    """从数据库URL中解析连接信息"""
    pattern = r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)'
    match = re.match(pattern, url)
    if match:
        return {
            'user': match.group(1),
            'password': match.group(2),
            'host': match.group(3),
            'port': match.group(4),
            'dbname': match.group(5)
        }
    return None

# 获取数据库连接信息
db_info = parse_db_url(DATABASE_URL)
if not db_info:
    logger.error(f"无法解析数据库URL: {DATABASE_URL}")
    sys.exit(1)

# 设置备份目录
BACKUP_DIR = Path(__file__).parent.parent / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

def backup_database():
    """备份数据库"""
    try:
        # 生成备份文件名（使用时间戳）
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = BACKUP_DIR / f"{db_info['dbname']}_{timestamp}.sql"
        
        # 设置环境变量（用于pg_dump认证）
        env = os.environ.copy()
        env['PGPASSWORD'] = db_info['password']
        
        # 执行pg_dump命令
        logger.info(f"正在备份数据库 {db_info['dbname']} 到 {backup_file}...")
        
        cmd = [
            "pg_dump",
            "-h", db_info['host'],
            "-p", db_info['port'],
            "-U", db_info['user'],
            "-d", db_info['dbname'],
            "-F", "c",  # 使用自定义格式
            "-f", str(backup_file)
        ]
        
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            logger.info(f"数据库备份成功: {backup_file}")
            return str(backup_file)
        else:
            logger.error(f"数据库备份失败: {result.stderr}")
            return None
    
    except Exception as e:
        logger.error(f"备份数据库时出错: {str(e)}")
        return None

def restore_database(backup_file):
    """从备份文件恢复数据库"""
    try:
        # 检查备份文件是否存在
        backup_path = Path(backup_file)
        if not backup_path.exists():
            logger.error(f"备份文件不存在: {backup_file}")
            return False
        
        # 设置环境变量（用于pg_restore认证）
        env = os.environ.copy()
        env['PGPASSWORD'] = db_info['password']
        
        # 执行pg_restore命令
        logger.info(f"正在从 {backup_file} 恢复数据库 {db_info['dbname']}...")
        
        cmd = [
            "pg_restore",
            "-h", db_info['host'],
            "-p", db_info['port'],
            "-U", db_info['user'],
            "-d", db_info['dbname'],
            "-c",  # 清除（删除）目标数据库中的对象
            str(backup_path)
        ]
        
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            logger.info(f"数据库恢复成功!")
            return True
        else:
            logger.error(f"数据库恢复失败: {result.stderr}")
            return False
    
    except Exception as e:
        logger.error(f"恢复数据库时出错: {str(e)}")
        return False

def list_backups():
    """列出所有备份文件"""
    try:
        backups = list(BACKUP_DIR.glob(f"{db_info['dbname']}_*.sql"))
        backups.sort(reverse=True)  # 按时间倒序排列
        
        if not backups:
            logger.info("没有找到备份文件")
            return []
        
        logger.info("可用的备份文件:")
        for i, backup in enumerate(backups, 1):
            # 从文件名中提取时间戳
            timestamp_str = backup.stem.split('_', 1)[1]
            try:
                timestamp = datetime.datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
                formatted_time = timestamp.strftime("%Y-%m-%d %H:%M:%S")
            except ValueError:
                formatted_time = "未知时间"
            
            size_mb = backup.stat().st_size / (1024 * 1024)
            logger.info(f"{i}. {backup.name} ({formatted_time}, {size_mb:.2f} MB)")
        
        return backups
    
    except Exception as e:
        logger.error(f"列出备份文件时出错: {str(e)}")
        return []

def cleanup_old_backups(keep_days=7):
    """清理旧的备份文件"""
    try:
        # 计算截止日期
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=keep_days)
        
        # 获取所有备份文件
        backups = list(BACKUP_DIR.glob(f"{db_info['dbname']}_*.sql"))
        deleted_count = 0
        
        for backup in backups:
            # 从文件名中提取时间戳
            try:
                timestamp_str = backup.stem.split('_', 1)[1]
                timestamp = datetime.datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
                
                # 如果备份文件早于截止日期，则删除
                if timestamp < cutoff_date:
                    backup.unlink()
                    deleted_count += 1
                    logger.info(f"已删除旧备份: {backup.name}")
            except (ValueError, IndexError):
                logger.warning(f"无法解析备份文件的时间戳: {backup.name}")
        
        logger.info(f"清理完成，共删除 {deleted_count} 个旧备份文件")
        return deleted_count
    
    except Exception as e:
        logger.error(f"清理旧备份文件时出错: {str(e)}")
        return 0

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="数据库备份和恢复工具")
    parser.add_argument("--backup", action="store_true", help="备份数据库")
    parser.add_argument("--restore", help="从指定的备份文件恢复数据库")
    parser.add_argument("--list", action="store_true", help="列出所有备份文件")
    parser.add_argument("--cleanup", type=int, metavar="DAYS", help="清理指定天数之前的旧备份")
    
    args = parser.parse_args()
    
    if args.backup:
        backup_database()
    elif args.restore:
        restore_database(args.restore)
    elif args.list:
        list_backups()
    elif args.cleanup is not None:
        cleanup_old_backups(args.cleanup)
    else:
        parser.print_help()

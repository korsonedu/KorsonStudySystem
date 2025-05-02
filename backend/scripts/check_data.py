#!/usr/bin/env python
"""
检查数据是否已经正确迁移
"""

import os
import sys
import logging
from sqlalchemy import select

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入数据库和模型
from app.database import engine, get_db
from app.modules.common.models import User
from app.modules.study.models import Task, Plan, Achievement

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_data():
    """检查数据是否已经正确迁移"""
    try:
        logger.info("开始检查数据...")
        
        # 获取数据库会话
        db = next(get_db())
        
        # 检查用户数据
        users = db.query(User).all()
        logger.info(f"用户数量: {len(users)}")
        for user in users:
            logger.info(f"用户: {user.id}, {user.username}, {user.email}")
        
        # 检查任务数据
        tasks = db.query(Task).all()
        logger.info(f"任务数量: {len(tasks)}")
        for task in tasks[:3]:  # 只显示前3个任务
            logger.info(f"任务: {task.id}, {task.name}, {task.duration}分钟, 用户ID: {task.user_id}")
        
        # 检查计划数据
        plans = db.query(Plan).all()
        logger.info(f"计划数量: {len(plans)}")
        for plan in plans:
            logger.info(f"计划: {plan.id}, {plan.text}, 完成状态: {plan.completed}, 用户ID: {plan.user_id}")
        
        # 检查成就数据
        achievements = db.query(Achievement).all()
        logger.info(f"成就数量: {len(achievements)}")
        for achievement in achievements:
            logger.info(f"成就: {achievement.id}, 类型: {achievement.type}, 等级: {achievement.level}, 用户ID: {achievement.user_id}")
        
        logger.info("数据检查完成！")
        return True
    except Exception as e:
        logger.error(f"检查数据时出错: {str(e)}")
        return False

if __name__ == "__main__":
    check_data()

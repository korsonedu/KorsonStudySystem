#!/usr/bin/env python
"""
创建数据库表结构
"""

import os
import sys
import logging

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入数据库和模型
from app.database import Base, engine
from app.modules.common.models import *
from app.modules.study.models import *

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_tables():
    """创建数据库表"""
    try:
        logger.info("开始创建数据库表...")
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功！")
        return True
    except Exception as e:
        logger.error(f"创建数据库表时出错: {str(e)}")
        return False

if __name__ == "__main__":
    create_tables()

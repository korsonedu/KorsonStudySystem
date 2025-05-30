#!/bin/bash
# 数据库迁移执行脚本 - 添加头像字段

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示标题
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}  头像字段数据库迁移执行脚本  ${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误: 未找到Python3${NC}"
    exit 1
fi

# 检查虚拟环境
if [ -d "venv" ]; then
    echo -e "${YELLOW}正在激活虚拟环境...${NC}"
    source venv/bin/activate
fi

# 备份数据库
echo -e "${YELLOW}正在备份数据库...${NC}"
python3 scripts/db_backup.py --backup
if [ $? -ne 0 ]; then
    echo -e "${RED}数据库备份失败，是否继续? (y/n)${NC}"
    read -r continue_choice
    if [ "$continue_choice" != "y" ]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 1
    fi
fi

# 检查迁移状态
echo -e "${YELLOW}正在检查迁移状态...${NC}"
python3 scripts/run_migrations.py --check

# 执行迁移
echo -e "${YELLOW}是否执行数据库迁移? (y/n)${NC}"
read -r run_migration
if [ "$run_migration" == "y" ]; then
    echo -e "${YELLOW}正在执行数据库迁移...${NC}"
    python3 scripts/run_migrations.py --run
    
    # 检查迁移是否成功
    if [ $? -ne 0 ]; then
        echo -e "${RED}迁移失败，是否尝试手动添加avatar列? (y/n)${NC}"
        read -r manual_add
        if [ "$manual_add" == "y" ]; then
            echo -e "${YELLOW}正在手动添加avatar列...${NC}"
            python3 scripts/init_db.py --add-avatar
        fi
    fi
fi

# 检查表结构
echo -e "${YELLOW}正在检查表结构...${NC}"
python3 scripts/init_db.py --check

echo -e "${GREEN}操作完成!${NC}"

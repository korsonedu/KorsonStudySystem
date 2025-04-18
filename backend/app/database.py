# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# 加载 .env 文件
load_dotenv()

# 获取 DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

# 检查 DATABASE_URL 是否正确加载
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the .env file")

# 创建数据库引擎
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 定义 get_db 函数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
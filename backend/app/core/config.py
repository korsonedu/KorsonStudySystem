import os
from dotenv import load_dotenv
from pathlib import Path

# 加载环境变量
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 环境配置
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

# 服务器配置
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dbuser:gyc050216@localhost:5432/KorsonStudySystem")
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "5"))
DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))

# 表前缀配置
# 不同系统的表使用不同的前缀，用户等表公用
TABLE_PREFIX = {
    "COMMON": "common_",  # 公共表前缀（用户、权限等）
    "STUDY": "study_",    # 学习追踪系统表前缀
    "COURSE": "course_",  # 课程系统表前缀
    "RANK": "rank_",      # 排行榜系统表前缀
    "QUIZ": "quiz_"       # 题库系统表前缀
}

# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "korsonacademy_secret_key_2024")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# CORS配置
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
# 确保允许前端开发服务器的请求
CORS_ORIGINS = [FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]

# 邮件配置
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "korsonedu@gmail.com")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", "korsonedu@gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_TLS = os.getenv("MAIL_TLS", "True").lower() in ("true", "1", "t")
MAIL_SSL = os.getenv("MAIL_SSL", "False").lower() in ("true", "1", "t")

# 日志配置
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()

# 时区配置
TIMEZONE = os.getenv("TIMEZONE", "Asia/Shanghai")  # 默认使用中国时区

# 应用配置
APP_NAME = "Korson Study System"
APP_DESCRIPTION = "A comprehensive learning platform with multiple modules"
APP_VERSION = "1.0.0"

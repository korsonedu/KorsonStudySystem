import os
from dotenv import load_dotenv
from pathlib import Path

# 加载环境变量
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 环境配置
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")

# 服务器配置
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dbuser:gyc050216@localhost:5432/learning_tracker")
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "5"))
DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))

# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "korsonacademy_secret_key_2024")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# CORS配置
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS_ORIGINS = [FRONTEND_URL]
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

# 应用配置
APP_NAME = "Kesheng Smart Finance Learning Tracker"
APP_DESCRIPTION = "A learning tracker for Kesheng Smart Finance"
APP_VERSION = "1.0.0"

# 生产环境部署指南

本文档提供了将应用部署到生产环境的详细步骤和最佳实践。

## 目录

1. [准备工作](#准备工作)
2. [后端部署](#后端部署)
3. [前端部署](#前端部署)
4. [数据库配置](#数据库配置)
5. [环境变量配置](#环境变量配置)
6. [CORS配置](#cors配置)
7. [安全性考虑](#安全性考虑)
8. [性能优化](#性能优化)
9. [监控和日志](#监控和日志)
10. [故障排除](#故障排除)

## 准备工作

### 系统要求

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Nginx (用于反向代理)
- 具有公网IP的服务器或云服务

### 域名和SSL

1. 为应用注册域名
2. 获取SSL证书 (推荐使用Let's Encrypt)

## 后端部署

### 1. 克隆代码库

```bash
git clone <repository-url>
cd newstudytool
```

### 2. 设置Python虚拟环境

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
```

### 3. 配置环境变量

复制示例环境变量文件并进行配置：

```bash
cp .env.example .env
# 编辑.env文件，设置生产环境的值
```

关键配置项：
- 将`ENVIRONMENT`设置为`production`
- 设置强随机的`SECRET_KEY`
- 配置正确的数据库连接字符串
- 设置前端URL用于CORS配置

### 4. 数据库迁移

```bash
alembic upgrade head
```

### 5. 使用Gunicorn启动应用

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

推荐使用systemd服务管理应用：

```
[Unit]
Description=Study Tool Backend
After=network.target

[Service]
User=<your-user>
Group=<your-group>
WorkingDirectory=/path/to/newstudytool/backend
Environment="PATH=/path/to/newstudytool/backend/venv/bin"
EnvironmentFile=/path/to/newstudytool/backend/.env
ExecStart=/path/to/newstudytool/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## 前端部署

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量

创建生产环境配置文件：

```bash
cp .env.example .env.production
# 编辑.env.production文件，设置生产环境的值
```

关键配置项：
- 设置后端API的正确URL
- 配置适当的超时和重试参数

### 3. 构建前端应用

```bash
npm run build
```

这将在`dist`目录中生成静态文件。

### 4. 配置Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /path/to/newstudytool/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 数据库配置

### 多应用共享数据库架构

本项目采用了多个webapp共享同一个数据库的架构设计：

1. **数据库名称**: `KorsonStudySystem`
2. **表前缀设计**:
   - 公共表: `common_*` (用户、权限等)
   - 学习追踪系统: `study_*`
   - 课程系统: `course_*`
   - 排行榜系统: `rank_*`
   - 题库系统: `quiz_*`

这种设计允许多个应用共享用户认证和基础数据，同时保持各自功能模块的独立性。

### 数据库迁移

如果您从旧版本升级，需要运行数据库迁移脚本：

```bash
cd backend
source venv/bin/activate
python scripts/migrate_db.py
```

这将把旧数据库中的数据迁移到新的表结构中。

### PostgreSQL优化

编辑`postgresql.conf`：

```
# 连接设置
max_connections = 100

# 内存设置
shared_buffers = 1GB  # 服务器内存的25%
work_mem = 32MB
maintenance_work_mem = 256MB

# 写入设置
wal_buffers = 16MB
checkpoint_completion_target = 0.9
```

### 备份策略

设置定时备份：

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres KorsonStudySystem > "$BACKUP_DIR/KorsonStudySystem_$TIMESTAMP.sql"
find "$BACKUP_DIR" -name "KorsonStudySystem_*.sql" -mtime +7 -delete
EOF

# 添加执行权限
chmod +x backup.sh

# 添加到crontab
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 环境变量配置

### 前端环境变量注入

为了在运行时注入环境变量，创建一个脚本：

```bash
cat > /path/to/newstudytool/frontend/dist/env-config.js << EOF
window.__ENV__ = {
  BACKEND_PROTOCOL: 'https',
  BACKEND_HOST: 'yourdomain.com',
  BACKEND_PORT: '',
  BACKEND_BASE_PATH: '/api',
  // 其他环境变量...
};
EOF
```

在`index.html`中引入此脚本：

```html
<head>
  <!-- 其他标签 -->
  <script src="/env-config.js"></script>
</head>
```

## CORS配置

确保后端的CORS配置正确：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # 生产环境前端URL
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Content-Type"]
)
```

## 安全性考虑

### 1. 启用HTTPS

确保所有通信都通过HTTPS进行。

### 2. 设置安全头部

在Nginx配置中添加：

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;" always;
```

### 3. 定期更新依赖

定期检查并更新依赖项以修复安全漏洞：

```bash
# 前端
npm audit fix

# 后端
pip list --outdated
pip install --upgrade <package-name>
```

## 性能优化

### 1. 启用Gzip压缩

在Nginx配置中添加：

```nginx
gzip on;
gzip_comp_level 5;
gzip_min_length 256;
gzip_proxied any;
gzip_types
  application/javascript
  application/json
  application/xml
  text/css
  text/plain
  text/xml;
```

### 2. 配置缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}
```

### 3. 使用CDN

考虑使用CDN来分发静态资源。

## 监控和日志

### 1. 配置日志

在后端的`.env`文件中设置：

```
LOG_LEVEL=info
```

### 2. 设置监控

考虑使用以下工具：
- Prometheus + Grafana 用于性能监控
- Sentry 用于错误跟踪
- ELK Stack 用于日志管理

## 故障排除

### 常见问题

1. **CORS错误**
   - 检查前端和后端的URL配置
   - 确保CORS中间件配置正确

2. **数据库连接问题**
   - 检查数据库连接字符串
   - 确保数据库服务器可访问

3. **500内部服务器错误**
   - 检查后端日志
   - 确保所有必要的环境变量都已设置

4. **前端路由问题**
   - 确保Nginx配置中的`try_files`指令正确

### 获取帮助

如有问题，请联系：
- 技术支持：[support@example.com](mailto:support@example.com)
- 项目负责人：[lead@example.com](mailto:lead@example.com)

# 科晟智慧学习系统 - 生产环境部署指南

本文档提供了将科晟智慧学习系统部署到生产环境的详细步骤和最佳实践，确保系统稳定、安全且高效运行。

**最后更新日期**: 2024年5月

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

- **服务器**：至少 2GB RAM, 1 CPU核心, 20GB SSD
- **操作系统**：Ubuntu 20.04 LTS 或更高版本
- **Python**：3.12+
- **Node.js**：18+
- **PostgreSQL**：14+
- **Nginx**：1.18+ (用于反向代理)
- **具有公网IP的服务器或云服务**

### 域名和SSL

1. 为应用注册域名 (例如 `study.yourdomain.com`)
2. 配置DNS记录，将域名指向服务器IP
3. 获取SSL证书:
   - 推荐使用Let's Encrypt (免费，自动续期)
   - 使用Certbot自动配置Nginx SSL设置
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d study.yourdomain.com
   ```

### 防火墙配置

确保以下端口开放：
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 5432 (PostgreSQL，仅限内部网络)
- 8000 (后端API，仅限内部网络)
- 8002 (WebSocket服务，仅限内部网络)

```bash
# 使用UFW配置防火墙
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 后端部署

### 1. 安装依赖软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装依赖
sudo apt install -y python3.12 python3.12-venv python3.12-dev build-essential libpq-dev postgresql postgresql-contrib nginx git

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. 克隆代码库

```bash
# 创建应用目录
sudo mkdir -p /opt/StudySystem
sudo chown $USER:$USER /opt/StudySystem

# 克隆代码
git clone https://github.com/yourusername/newstudytool.git /opt/StudySystem/newstudytool
cd /opt/StudySystem/newstudytool
```

### 3. 设置Python虚拟环境

```bash
cd /opt/StudySystem/newstudytool/backend
python3.12 -m venv venv
source venv/bin/activate

# 升级pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt

# 安装WebSocket依赖
pip install uvicorn[standard] websockets
```

### 4. 配置环境变量

创建并配置环境变量文件：

```bash
# 复制示例环境变量文件
cp .env.example .env

# 编辑环境变量文件
nano .env
```

关键配置项：
- 设置 `ENVIRONMENT=production`
- 设置 `DEBUG=False`
- 生成并设置强随机的 `SECRET_KEY`：
  ```bash
  # 生成随机密钥
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- 配置数据库连接：
  ```
  DATABASE_URL=postgresql://username:password@localhost/korsonstudysystem
  ```
- 设置前端URL用于CORS配置：
  ```
  CORS_ORIGINS=https://study.yourdomain.com
  ```
- 配置邮件服务（用于用户注册验证）
- 设置时区：`TIMEZONE=Asia/Shanghai`

### 5. 创建并配置数据库

```bash
# 切换到postgres用户
sudo -u postgres psql

# 在PostgreSQL中执行
CREATE DATABASE korsonstudysystem;
CREATE USER studyuser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE korsonstudysystem TO studyuser;
\q

# 更新.env文件中的数据库连接字符串
```

### 6. 数据库迁移

```bash
cd /opt/StudySystem/newstudytool/backend
source venv/bin/activate
alembic upgrade head
```

### 7. 创建systemd服务

#### 后端API服务

```bash
sudo nano /etc/systemd/system/studytool-api.service
```

添加以下内容：

```ini
[Unit]
Description=Study Tool Backend API
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/StudySystem/newstudytool/backend
Environment="PATH=/opt/StudySystem/newstudytool/backend/venv/bin"
EnvironmentFile=/opt/StudySystem/newstudytool/backend/.env
ExecStart=/opt/StudySystem/newstudytool/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
Restart=always
RestartSec=5
StartLimitInterval=0

[Install]
WantedBy=multi-user.target
```

#### WebSocket服务

```bash
sudo nano /etc/systemd/system/studytool-websocket.service
```

添加以下内容：

```ini
[Unit]
Description=Study Tool WebSocket Service
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/StudySystem/newstudytool/backend
Environment="PATH=/opt/StudySystem/newstudytool/backend/venv/bin"
EnvironmentFile=/opt/StudySystem/newstudytool/backend/.env
ExecStart=/opt/StudySystem/newstudytool/backend/venv/bin/uvicorn app.websocket_server:app --host 0.0.0.0 --port 8002
Restart=always
RestartSec=5
StartLimitInterval=0

[Install]
WantedBy=multi-user.target
```

### 8. 启动服务

```bash
# 设置目录权限
sudo chown -R www-data:www-data /opt/StudySystem/newstudytool

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable studytool-api.service
sudo systemctl enable studytool-websocket.service
sudo systemctl start studytool-api.service
sudo systemctl start studytool-websocket.service

# 检查服务状态
sudo systemctl status studytool-api.service
sudo systemctl status studytool-websocket.service
```

## 前端部署

### 1. 安装依赖并构建前端应用

```bash
# 进入前端目录
cd /opt/StudySystem/newstudytool/frontend

# 安装依赖
npm install

# 创建生产环境变量文件
cp .env.example .env

# 编辑环境变量文件，设置生产环境API地址
nano .env
```

配置前端环境变量：
```
# 生产环境API地址
VITE_API_BASE_URL=https://study.yourdomain.com/api
VITE_BACKEND_PROTOCOL=https
VITE_BACKEND_HOST=study.yourdomain.com
VITE_BACKEND_PORT=443
VITE_WS_URL=wss://study.yourdomain.com/ws
```

```bash
# 构建前端应用
npm run build
```

构建完成后，静态文件将生成在 `dist` 目录中。

### 2. 配置Nginx

创建Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/studytool
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name study.yourdomain.com;

    # 重定向到HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name study.yourdomain.com;

    # SSL配置 (由Certbot自动管理)
    ssl_certificate /etc/letsencrypt/live/study.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/study.yourdomain.com/privkey.pem;

    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS设置
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 前端静态文件
    location / {
        root /opt/StudySystem/newstudytool/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90s;
    }

    # WebSocket代理
    location /ws {
        proxy_pass http://localhost:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s; # 24小时
        proxy_send_timeout 86400s; # 24小时
    }

    # 安全设置
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
}
```

### 3. 启用Nginx配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/studytool /etc/nginx/sites-enabled/

# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```
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
  API_BASE_URL: 'https://yourdomain.com/api',
  TIMEZONE: 'Asia/Shanghai',
  TIMEZONE_OFFSET: '8',
  DEFAULT_POMODORO_TIME: '25',
  DEFAULT_BREAK_TIME: '5',
  APP_NAME: '科晟智慧学习系统'
};
EOF
```

这个脚本会在前端运行时覆盖构建时的环境变量，确保前端能够正确连接到后端API。

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

确保所有通信都通过HTTPS进行：

- 使用Let's Encrypt获取免费SSL证书
- 配置自动续期
- 强制HTTP到HTTPS重定向
- 使用强密码套件和安全协议

### 2. 设置安全头部

在Nginx配置中添加以下安全头部：

```nginx
# HSTS - 强制使用HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# 防止MIME类型嗅探攻击
add_header X-Content-Type-Options "nosniff" always;

# 防止点击劫持
add_header X-Frame-Options "SAMEORIGIN" always;

# 启用XSS过滤器
add_header X-XSS-Protection "1; mode=block" always;

# 内容安全策略
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' wss:; frame-ancestors 'self';" always;

# 引用策略
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 权限策略
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
```

### 3. 防火墙和网络安全

- 使用UFW配置防火墙，只开放必要端口
- 使用fail2ban防止暴力攻击
- 禁用不必要的服务和端口

```bash
# 安装fail2ban
sudo apt install fail2ban

# 配置fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# 启动fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. 定期更新依赖

创建自动化脚本定期检查并更新依赖项以修复安全漏洞：

```bash
#!/bin/bash
# 保存为 /opt/StudySystem/update_dependencies.sh

# 更新系统包
apt update && apt upgrade -y

# 更新前端依赖
cd /opt/StudySystem/newstudytool/frontend
npm audit fix
npm update

# 更新后端依赖
cd /opt/StudySystem/newstudytool/backend
source venv/bin/activate
pip list --outdated | cut -d ' ' -f1 | tail -n +3 > outdated.txt
if [ -s outdated.txt ]; then
  cat outdated.txt | xargs -n1 pip install -U
fi
rm outdated.txt

# 重启服务
systemctl restart studytool-api.service
systemctl restart studytool-websocket.service
systemctl restart nginx
```

```bash
# 添加执行权限
chmod +x /opt/StudySystem/update_dependencies.sh

# 添加到crontab，每周日凌晨3点执行
echo "0 3 * * 0 /opt/StudySystem/update_dependencies.sh >> /var/log/dependency_updates.log 2>&1" | sudo tee -a /etc/crontab
```

### 5. 数据安全

- 定期备份数据库
- 加密敏感数据
- 实施最小权限原则
- 使用参数化查询防止SQL注入

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

### 1. 配置应用日志

在后端的`.env`文件中设置日志级别和格式：

```
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/studytool/app.log
```

创建日志目录并设置权限：

```bash
# 创建日志目录
sudo mkdir -p /var/log/studytool
sudo chown www-data:www-data /var/log/studytool
```

### 2. 配置日志轮转

创建logrotate配置以防止日志文件过大：

```bash
sudo nano /etc/logrotate.d/studytool
```

添加以下内容：

```
/var/log/studytool/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload studytool-api.service >/dev/null 2>&1 || true
        systemctl reload studytool-websocket.service >/dev/null 2>&1 || true
    endscript
}
```

### 3. 设置系统监控

#### 基本监控

使用简单的系统监控工具：

```bash
# 安装基本监控工具
sudo apt install -y htop iotop iftop ncdu

# 安装netdata实时监控
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

访问 `https://study.yourdomain.com:19999` 查看netdata监控面板。

#### 高级监控

对于更复杂的监控需求，可以设置：

1. **Prometheus + Grafana**：
   ```bash
   # 安装Prometheus
   sudo apt install -y prometheus prometheus-node-exporter

   # 安装Grafana
   sudo apt-get install -y apt-transport-https software-properties-common
   wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
   echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
   sudo apt-get update
   sudo apt-get install -y grafana

   # 启动服务
   sudo systemctl enable prometheus prometheus-node-exporter grafana-server
   sudo systemctl start prometheus prometheus-node-exporter grafana-server
   ```

2. **Sentry**：用于错误跟踪和异常监控
   - 在后端代码中集成Sentry SDK
   - 在前端代码中集成Sentry Browser SDK

3. **ELK Stack**：用于集中式日志管理
   - Elasticsearch：日志存储和搜索
   - Logstash：日志收集和处理
   - Kibana：日志可视化和分析

### 4. 性能监控

监控关键性能指标：

- CPU使用率
- 内存使用情况
- 磁盘I/O
- 网络流量
- 数据库查询性能
- API响应时间
- 前端加载时间

### 5. 告警设置

配置关键指标的告警通知：

```bash
# 安装邮件发送工具
sudo apt install -y mailutils

# 创建告警脚本
cat > /opt/StudySystem/alert.sh << 'EOF'
#!/bin/bash
# 简单的系统资源告警脚本

# 检查CPU使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
  echo "警告: CPU使用率过高 ($CPU_USAGE%)" | mail -s "系统告警: 高CPU使用率" admin@yourdomain.com
fi

# 检查内存使用率
MEM_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
if (( $(echo "$MEM_USAGE > 90" | bc -l) )); then
  echo "警告: 内存使用率过高 ($MEM_USAGE%)" | mail -s "系统告警: 高内存使用率" admin@yourdomain.com
fi

# 检查磁盘使用率
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 90 ]; then
  echo "警告: 磁盘使用率过高 ($DISK_USAGE%)" | mail -s "系统告警: 高磁盘使用率" admin@yourdomain.com
fi
EOF

# 添加执行权限
chmod +x /opt/StudySystem/alert.sh

# 添加到crontab，每小时执行一次
echo "0 * * * * /opt/StudySystem/alert.sh" | sudo tee -a /etc/crontab
```

## 故障排除

### 常见问题及解决方案

#### 1. WebSocket连接问题

**症状**：在线用户功能不工作，前端无法连接到WebSocket服务

**解决方案**：
- 检查WebSocket服务是否正在运行：
  ```bash
  sudo systemctl status studytool-websocket.service
  ```
- 确认Nginx WebSocket代理配置正确：
  ```bash
  # 检查Nginx配置
  sudo nginx -t

  # 查看WebSocket日志
  sudo journalctl -u studytool-websocket.service
  ```
- 检查前端WebSocket URL配置是否正确（应为 `wss://study.yourdomain.com/ws`）
- 确保防火墙允许WebSocket流量

#### 2. CORS错误

**症状**：浏览器控制台显示CORS错误，API请求失败

**解决方案**：
- 检查前端和后端的URL配置是否匹配
- 确保后端CORS中间件配置正确：
  ```python
  # 在后端代码中检查CORS配置
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://study.yourdomain.com"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- 检查Nginx配置是否正确传递CORS头部

#### 3. 数据库连接问题

**症状**：后端服务启动失败，日志显示数据库连接错误

**解决方案**：
- 检查数据库连接字符串是否正确：
  ```bash
  # 检查环境变量
  grep DATABASE_URL /opt/StudySystem/newstudytool/backend/.env

  # 测试数据库连接
  sudo -u www-data psql -h localhost -U studyuser -d korsonstudysystem
  ```
- 确保PostgreSQL服务正在运行：
  ```bash
  sudo systemctl status postgresql
  ```
- 检查数据库用户权限：
  ```sql
  -- 在PostgreSQL中执行
  \du studyuser
  ```

#### 4. 500内部服务器错误

**症状**：API请求返回500错误，应用无法正常工作

**解决方案**：
- 检查后端日志：
  ```bash
  sudo tail -n 100 /var/log/studytool/app.log
  ```
- 确保所有必要的环境变量都已设置：
  ```bash
  # 检查环境变量文件
  sudo cat /opt/StudySystem/newstudytool/backend/.env
  ```
- 检查服务状态：
  ```bash
  sudo systemctl status studytool-api.service
  ```
- 尝试重启服务：
  ```bash
  sudo systemctl restart studytool-api.service
  ```

#### 5. 前端路由问题

**症状**：刷新页面时出现404错误

**解决方案**：
- 确保Nginx配置中的`try_files`指令正确：
  ```nginx
  location / {
      root /opt/StudySystem/newstudytool/frontend/dist;
      index index.html;
      try_files $uri $uri/ /index.html;
  }
  ```
- 检查前端构建是否正确：
  ```bash
  # 重新构建前端
  cd /opt/StudySystem/newstudytool/frontend
  npm run build
  ```

#### 6. SSL证书问题

**症状**：浏览器显示SSL证书错误

**解决方案**：
- 检查证书是否过期：
  ```bash
  sudo certbot certificates
  ```
- 更新证书：
  ```bash
  sudo certbot renew
  ```
- 确保Nginx配置中的证书路径正确

### 日志检查

当遇到问题时，检查以下日志文件：

```bash
# Nginx错误日志
sudo tail -n 100 /var/log/nginx/error.log

# 应用日志
sudo tail -n 100 /var/log/studytool/app.log

# 系统日志
sudo journalctl -u studytool-api.service
sudo journalctl -u studytool-websocket.service

# PostgreSQL日志
sudo tail -n 100 /var/log/postgresql/postgresql-14-main.log
```

### 获取帮助

如有问题，请联系：
- 技术支持：科晟智慧技术团队 (support@korsonedu.com)
- 项目负责人：科晟智慧项目经理 (manager@korsonedu.com)
- 紧急联系电话：+86 123-4567-8910

## 部署后检查清单

在完成部署后，请检查以下项目：

1. 确认前端能够正常访问并显示
2. 确认用户注册和登录功能正常
3. 确认番茄钟功能正常工作
4. 确认任务记录能够正确保存
5. 确认统计页面能够正确显示数据
6. 确认成就系统正常工作
7. 确认海报生成功能正常
8. 检查所有API端点的响应时间
9. 确认系统在移动设备上的响应式布局
10. 确认数据库备份机制正常工作

## 定期维护

建议每月执行以下维护任务：

1. 检查系统日志，查找潜在问题
2. 更新依赖包以修复安全漏洞
3. 执行数据库备份
4. 检查磁盘空间使用情况
5. 监控系统性能指标

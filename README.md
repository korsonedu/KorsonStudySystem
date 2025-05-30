# 科晟智慧学习系统

一个综合性学习平台，专为考研学生设计，提供全方位的学习管理和追踪功能。

**状态**: 生产就绪

![版本](https://img.shields.io/badge/版本-1.0.0-blue)
![Vue](https://img.shields.io/badge/Vue-3.5-brightgreen)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-orange)

## 系统概述

科晟智慧学习系统是一个专为考研学生设计的综合学习平台，帮助学生高效管理学习计划、追踪学习进度、分析学习数据，并提供社交激励机制。

### 核心功能

- **番茄钟学习法**：科学的时间管理工具，支持自定义时长和任务名称
- **学习计划管理**：创建、编辑和追踪每日学习计划
- **数据可视化**：直观展示学习时间分布和学习热力图
- **成就系统**：通过完成学习目标解锁成就，增强学习动力
- **在线用户互动**：实时显示在线用户，营造学习氛围
- **个人资料管理**：设置考研目标院校、专业和备考阶段

### 子系统说明

#### 1. 学习追踪系统

- **功能**：番茄钟计时、任务管理、学习统计、成就系统、在线用户互动
- **特色**：支持计划拖放到番茄钟自动开始、完成后自动标记计划为已完成
- **状态**：已实现

#### 2. 课程系统

- **功能**：课程管理、学习进度跟踪、课程内容展示
- **状态**：计划中

#### 3. 排行榜系统

- **功能**：学习时间排行、成就排行、积分排行
- **状态**：计划中

#### 4. 题库系统

- **功能**：题目管理、做题记录、错题本
- **状态**：计划中

## 技术栈

### 前端
- **框架**：Vue 3 + TypeScript + Vite
- **UI组件**：shadcn-vue + Tailwind CSS
- **状态管理**：Pinia
- **路由**：Vue Router
- **HTTP客户端**：Axios
- **WebSocket**：原生WebSocket API
- **图表**：Chart.js + Vue-ChartJS
- **通知**：Vue-Sonner

### 后端
- **框架**：FastAPI + SQLAlchemy + PostgreSQL
- **认证**：JWT + OAuth2
- **WebSocket**：FastAPI WebSockets
- **数据库迁移**：Alembic
- **任务队列**：Background Tasks

### 部署
- **容器化**：Docker + Docker Compose
- **Web服务器**：Nginx
- **进程管理**：Gunicorn + Uvicorn
- **SSL**：Let's Encrypt

## 快速开始

### 系统要求

- **操作系统**：Linux (推荐 Ubuntu 20.04+) / macOS / Windows
- **Node.js**：18.x 或更高版本
- **Python**：3.12 或更高版本
- **PostgreSQL**：14 或更高版本
- **内存**：至少 2GB RAM
- **存储**：至少 1GB 可用空间

### 开发环境设置

#### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/newstudytool.git
cd newstudytool
```

#### 2. 前端启动

```bash
# 安装依赖
cd frontend
npm install

# 创建环境变量文件
cp .env.example .env
# 编辑.env文件配置本地开发环境

# 启动开发服务器
npm run dev
```

#### 3. 后端启动

```bash
# 切换到后端目录
cd backend

# 创建并激活虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
.\venv\Scripts\activate

# 激活虚拟环境 (Linux/Mac)
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建环境变量文件
cp .env.example .env
# 编辑.env文件配置数据库连接等

# 运行数据库迁移
alembic upgrade head

# 启动服务器
uvicorn app.main:app --reload
```

#### 4. WebSocket服务启动

```bash
# 确保已安装WebSocket依赖
pip install uvicorn[standard] websockets

# 启动WebSocket服务
uvicorn app.websocket_server:app --port 8002
```

### 生产环境部署

生产环境部署请参考 [DEPLOYMENT.md](DEPLOYMENT.md) 文件，其中包含了详细的部署步骤和最佳实践，包括：

- Nginx配置与SSL设置
- 数据库优化
- 环境变量配置
- 安全性考虑
- 性能优化
- 监控和日志设置

生产环境准备清单请参考 [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) 文件，其中总结了为生产环境部署所做的准备工作。

## 项目结构

```
.
├── backend/                  # 后端代码
│   ├── app/                  # 应用代码
│   │   ├── core/             # 核心功能
│   │   │   ├── config.py     # 配置文件
│   │   │   └── database.py   # 数据库连接
│   │   ├── modules/          # 各个webapp模块
│   │   │   ├── common/       # 公共模块（用户、认证等）
│   │   │   │   ├── models/   # 数据库模型
│   │   │   │   ├── schemas/  # Pydantic模型
│   │   │   │   └── routers/  # API路由
│   │   │   ├── study/        # 学习追踪系统
│   │   │   │   ├── models/   # 数据库模型
│   │   │   │   ├── schemas/  # Pydantic模型
│   │   │   │   └── routers/  # API路由
│   │   │   ├── course/       # 课程系统
│   │   │   ├── leaderboard/  # 排行榜系统
│   │   │   └── quiz/         # 题库系统
│   │   └── main.py           # 主入口文件
│   ├── scripts/              # 脚本文件
│   └── alembic/              # 数据库迁移
├── frontend/                 # 前端代码
│   ├── src/                  # 源代码
│   │   ├── apps/             # 各个webapp模块
│   │   │   ├── study/        # 学习追踪系统
│   │   │   │   ├── components/ # 组件
│   │   │   │   ├── services/   # 服务
│   │   │   │   └── views/      # 视图
│   │   │   ├── course/       # 课程系统
│   │   │   ├── leaderboard/  # 排行榜系统
│   │   │   └── quiz/         # 题库系统
│   │   ├── shared/           # 共享组件和服务
│   │   │   ├── components/   # 共享组件
│   │   │   ├── services/     # 共享服务
│   │   │   ├── utils/        # 共享工具
│   │   │   └── views/        # 共享视图（登录、注册等）
│   │   ├── config/           # 配置文件
│   │   ├── router/           # 路由配置
│   │   └── App.vue           # 主应用组件
│   └── public/               # 静态资源
└── README.md                 # 项目说明
```

## 数据库

所有子系统共享同一个数据库 `KorsonStudySystem`，使用不同的表前缀区分：

- 公共表：`common_*`
- 学习追踪系统：`study_*`
- 课程系统：`course_*`
- 排行榜系统：`rank_*`
- 题库系统：`quiz_*`

### 数据库迁移

系统使用Alembic进行数据库迁移管理。我们提供了多个脚本来简化数据库管理：

#### 执行迁移

```bash
# 在backend目录下运行
./migrate_avatar.sh
```

这个脚本会自动执行以下操作：
1. 备份当前数据库
2. 检查迁移状态
3. 执行待执行的迁移
4. 验证迁移结果

#### 手动管理迁移

也可以使用以下脚本手动管理数据库：

```bash
# 检查迁移状态
python scripts/run_migrations.py --check

# 执行所有待执行的迁移
python scripts/run_migrations.py --run

# 创建新的迁移文件
python scripts/run_migrations.py --create "迁移说明"

# 初始化数据库和表
python scripts/init_db.py --init

# 检查表结构
python scripts/init_db.py --check

# 备份数据库
python scripts/db_backup.py --backup

# 从备份恢复数据库
python scripts/db_backup.py --restore backups/KorsonStudySystem_20250515_120000.sql
```

更多详细信息请参考 `backend/scripts/README.md` 文件。

## 环境变量配置

项目使用统一的环境变量文件 `.env`，包含前后端共享的配置。主要配置项包括：

### 后端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `ENVIRONMENT` | 运行环境 | `development` 或 `production` |
| `DEBUG` | 调试模式 | `True` 或 `False` |
| `SECRET_KEY` | JWT密钥 | `your-secret-key` |
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:password@localhost/dbname` |
| `CORS_ORIGINS` | 允许的跨域来源 | `http://localhost:5173` |
| `TIMEZONE` | 系统时区 | `Asia/Shanghai` |

### 前端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 后端API基础URL | `http://localhost:8000` |
| `VITE_BACKEND_PROTOCOL` | 后端协议 | `http` 或 `https` |
| `VITE_BACKEND_HOST` | 后端主机名 | `localhost` |
| `VITE_BACKEND_PORT` | 后端端口 | `8000` |
| `VITE_WS_URL` | WebSocket连接URL | `ws://localhost:8002/ws` |

详细配置说明请参考示例环境变量文件 `.env.example` 中的注释。

## 特色功能实现

### 1. 计划拖放自动开始

学习计划可以直接拖放到番茄钟区域，系统会自动：
- 填充任务名称
- 开始计时
- 完成后自动标记计划为已完成

### 2. 实时在线用户

通过WebSocket实现的实时在线用户功能：
- 用户登录后自动连接WebSocket服务
- 实时显示当前在线的其他用户
- 心跳机制保持连接活跃
- 自动重连和错误处理

### 3. 学习数据可视化

直观的学习数据展示：
- 学习热力图显示每日学习时长
- 时间分布图展示学习时段偏好
- 成就系统激励持续学习

## 贡献指南

如需贡献代码，请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 开发规范

### 前端开发规范
- **代码风格**：遵循 Vue 官方推荐的代码风格指南
- **组件命名**：使用 PascalCase 命名组件（如 `StudyTimer.vue`）
- **样式规范**：
  - 使用 Tailwind CSS 进行样式设计
  - 避免全局 CSS 样式污染
  - 组件样式使用 `scoped` 属性
- **提交规范**：采用 [Conventional Commits](https://www.conventionalcommits.org/) 提交规范

### 后端开发规范
- **代码风格**：遵循 PEP8 Python 编码规范
- **API 设计**：
  - 遵循 RESTful API 设计规范
  - 使用统一的响应格式
  - 错误码标准化
- **数据库**：
  - 所有表名使用小写和下划线分隔
  - 字段命名保持一致性
  - 添加必要的索引

## API 文档

后端自动生成 OpenAPI 文档，访问方式如下：

1. 启动后端服务
2. 访问以下任一地址查看交互式 API 文档：
   - http://localhost:8000/docs (Swagger UI)
   - http://localhost:8000/redoc (ReDoc)

文档包含所有 API 的详细说明，包括：
- 请求参数和类型
- 响应示例
- 认证要求
- 错误码说明

## 部署优化

### 环境准备
在生产环境部署前，请确保完成以下准备：

1. **域名配置**：
   - 准备有效的域名
   - 配置 DNS 解析到服务器 IP 地址

2. **SSL 证书**：
   - 推荐使用 Let's Encrypt 免费证书
   - 或者购买商业 SSL 证书

3. **服务器配置**：
   - 最低配置：2 核 CPU，4GB 内存，50GB 存储
   - 推荐配置：4 核 CPU，8GB 内存，100GB 存储

### 数据库优化

1. **连接池配置**：
   - 生产环境建议使用 PgBouncer 连接池
   - 调整最大连接数限制

2. **备份策略**：
   - 每日自动备份
   - 备份保留周期不少于 7 天
   - 测试备份恢复流程

3. **监控告警**：
   - 监控数据库性能指标（CPU、内存、磁盘 IO）
   - 设置慢查询告警
   - 监控连接数和锁等待

## 常见问题解答

### Q1: 启动前端时出现 `Error: certificate has expired`
**A**: 这是由于 Vite 开发服务器的自签名证书过期导致。解决方法：
1. 删除 `frontend/node_modules/vite` 目录
2. 重新安装依赖：`npm install`

### Q2: 如何重置数据库？
**A**: 可以使用提供的脚本重置数据库：
```bash
# 在 backend 目录下运行
python reset_sequence.py
```

### Q3: WebSocket 服务无法连接？
**A**: 请检查以下几点：
1. 确保 WebSocket 服务已启动
2. 检查防火墙设置是否开放相应端口
3. 确认 `VITE_WS_URL` 配置正确

### Q4: 登录时提示 "Invalid credentials"？
**A**: 请确认：
1. 用户名和密码是否正确
2. 数据库中是否存在该用户
3. JWT 密钥是否匹配

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md) 文件，记录了所有版本更新内容和变更说明。

# 科晟智慧学习系统

一个综合性学习平台，包含多个子系统。

**状态**: 生产就绪

## 子系统说明

### 1. 学习追踪系统

- 功能：番茄钟计时、任务管理、学习统计、成就系统
- 状态：已实现

### 2. 课程系统

- 功能：课程管理、学习进度跟踪、课程内容展示
- 状态：计划中

### 3. 排行榜系统

- 功能：学习时间排行、成就排行、积分排行
- 状态：计划中

### 4. 题库系统

- 功能：题目管理、做题记录、错题本
- 状态：计划中

## 技术栈

- 前端：Vue 3 + TypeScript + Vite
- 后端：FastAPI + SQLAlchemy + PostgreSQL
- 部署：Docker + Nginx

## 快速开始

### 开发环境

#### 前端启动

```bash
# 安装依赖
cd frontend
npm install

# 启动开发服务器
npm run dev
```

#### 后端启动

```bash
# 切换到后端目录
cd backend

# 激活虚拟环境 (Windows)
.\venv\Scripts\activate

# 激活虚拟环境 (Linux/Mac)
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务器
uvicorn app.main:app --reload
```

### 生产环境

生产环境部署请参考 [DEPLOYMENT.md](DEPLOYMENT.md) 文件，其中包含了详细的部署步骤和最佳实践。

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

## 环境变量

项目使用统一的环境变量文件 `.env`，包含前后端共享的配置。详细配置说明请参考该文件中的注释。

## 生产环境优化

为了准备生产环境部署，我们进行了以下优化：

1. 删除了所有调试代码和日志输出
2. 移除了冗余文件和重复配置
3. 优化了前端构建配置，启用了代码分割和压缩
4. 配置了生产环境特定的设置
5. 提供了详细的部署文档

## 贡献指南

如需贡献代码，请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request
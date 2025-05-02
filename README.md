# 学习看板应用

一个帮助学生管理学习任务、计划和成就的应用。

## 功能

- 学习任务看板 (番茄钟)
- 任务记录和统计
- 学习计划管理
- 成就系统

## 技术栈

- 前端：Vue 3 + TypeScript + Vite
- 后端：FastAPI + SQLAlchemy + PostgreSQL

## 快速开始

### 前端启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 后端启动

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

## 项目结构

```
├── .vscode/                      # VS Code 配置
├── backend/                      # 后端代码
│   ├── alembic/                  # 数据库迁移工具
│   │   ├── versions/             # 数据库迁移版本
│   │   └── env.py                # Alembic 环境配置
│   ├── app/                      # FastAPI 应用
│   │   ├── models/               # 数据库模型
│   │   │   ├── achievement.py    # 成就模型
│   │   │   ├── plan.py           # 计划模型
│   │   │   ├── task.py           # 任务模型
│   │   │   └── user.py           # 用户模型
│   │   ├── routers/              # API 路由
│   │   │   ├── achievements.py   # 成就相关路由
│   │   │   ├── auth.py           # 认证相关路由
│   │   │   ├── plans.py          # 计划相关路由
│   │   │   ├── statistics.py     # 统计相关路由
│   │   │   └── tasks.py          # 任务相关路由
│   │   ├── schemas/              # Pydantic 模型
│   │   │   ├── achievement.py    # 成就数据模式
│   │   │   ├── plan.py           # 计划数据模式
│   │   │   ├── statistic.py      # 统计数据模式
│   │   │   ├── task.py           # 任务数据模式
│   │   │   ├── token.py          # 令牌数据模式
│   │   │   └── user.py           # 用户数据模式
│   │   ├── services/             # 服务
│   │   │   └── email.py          # 邮件服务
│   │   ├── achievements_definitions.py # 成就定义
│   │   ├── auth.py               # 认证逻辑
│   │   ├── config.py             # 配置文件
│   │   ├── database.py           # 数据库配置
│   │   └── main.py               # 主应用入口
│   ├── .env                      # 环境变量
│   ├── .env.example              # 环境变量示例
│   ├── alembic.ini               # Alembic 配置
│   └── requirements.txt          # 后端依赖
│
├── example/                      # 示例代码
│   ├── achievements.html         # 成就页面示例
│   ├── achievements.js           # 成就相关 JS
│   ├── index.html                # 主页示例
│   ├── kanban.js                 # 看板相关 JS
│   ├── plans.js                  # 计划相关 JS
│   ├── statistics.html           # 统计页面示例
│   ├── statistics.js             # 统计相关 JS
│   ├── stats.css                 # 统计页面样式
│   └── styles.css                # 通用样式
│
├── frontend/                     # 前端代码
│   ├── public/                   # 公共资源
│   │   └── images/               # 图片资源
│   ├── src/                      # 源代码
│   │   ├── assets/               # 静态资源
│   │   ├── components/           # Vue 组件
│   │   │   ├── AchievementCard.vue  # 成就卡片组件
│   │   │   ├── CircularTimer.vue    # 圆形计时器组件
│   │   │   ├── Heatmap.vue          # 热图组件
│   │   │   ├── NavBar.vue           # 导航栏组件
│   │   │   ├── ShareButton.vue      # 分享按钮组件
│   │   │   ├── SharePoster.vue      # 分享海报组件
│   │   │   └── TimeDistributionChart.vue # 时间分布图组件
│   │   ├── config/               # 配置文件
│   │   │   ├── achievements.ts   # 成就配置
│   │   │   ├── api.ts            # API 配置
│   │   │   └── poster.ts         # 海报配置
│   │   ├── services/             # 服务
│   │   │   ├── api.ts            # API 服务
│   │   │   ├── authService.ts    # 认证服务
│   │   │   ├── planService.ts    # 计划服务
│   │   │   ├── taskService.ts    # 任务服务
│   │   │   └── userService.ts    # 用户服务
│   │   ├── utils/                # 工具函数
│   │   │   └── storage.ts        # 存储工具
│   │   ├── views/                # 页面视图
│   │   │   ├── Achievements.vue  # 成就页面
│   │   │   ├── Home.vue          # 主页
│   │   │   ├── Login.vue         # 登录页面
│   │   │   ├── Register.vue      # 注册页面
│   │   │   ├── Statistics.vue    # 统计页面
│   │   │   └── VerifyEmail.vue   # 邮箱验证页面
│   │   ├── App.vue               # 主应用组件
│   │   ├── main.ts               # 应用入口
│   │   └── style.css             # 全局样式
│   ├── .env.example              # 环境变量示例
│   ├── index.html                # HTML 入口
│   ├── package.json              # 前端依赖配置
│   ├── tsconfig.json             # TypeScript 配置
│   └── vite.config.ts            # Vite 配置
│
├── .env                          # 环境变量
├── .gitignore                    # Git 忽略文件
├── DEPLOYMENT.md                 # 部署文档
├── README.md                     # 项目说明文档
├── openapi.json                  # OpenAPI 规范
└── package.json                  # 项目依赖配置
```
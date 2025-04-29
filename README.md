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
├── backend/               # 后端代码
│   ├── app/               # FastAPI 应用
│   │   ├── models/        # 数据库模型
│   │   ├── routers/       # API 路由
│   │   ├── schemas/       # Pydantic 模型
│   │   ├── main.py        # 主应用入口
│   │   └── database.py    # 数据库配置
│   └── requirements.txt   # 后端依赖
│
└── src/                   # 前端代码
    ├── assets/            # 静态资源
    ├── components/        # Vue 组件
    ├── services/          # API 服务
    ├── views/             # 页面视图
    ├── App.vue            # 主应用组件
    └── main.ts            # 应用入口
``` 
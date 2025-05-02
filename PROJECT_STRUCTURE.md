# Korson学习系统项目结构

本文档描述了Korson学习系统的项目结构，包括前端和后端的文件组织方式。

## 目录

1. [概述](#概述)
2. [前端结构](#前端结构)
3. [后端结构](#后端结构)
4. [数据库结构](#数据库结构)
5. [开发指南](#开发指南)

## 概述

Korson学习系统是一个多应用集成平台，包含以下子系统：

1. **学习追踪系统** - 用于跟踪学习时间和进度
2. **课程系统** - 用于管理和学习课程内容（待开发）
3. **排行榜系统** - 用于展示学习排名（待开发）
4. **题库系统** - 用于练习题目（待开发）

所有子系统共享同一个用户认证系统和数据库，但使用不同的表前缀来区分数据。

## 前端结构

前端采用Vue 3 + TypeScript开发，使用模块化的结构组织代码：

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── apps/               # 各个应用模块
│   │   ├── study/          # 学习追踪系统
│   │   │   ├── components/ # 组件
│   │   │   ├── services/   # 服务
│   │   │   ├── views/      # 视图
│   │   │   └── index.ts    # 入口文件
│   │   ├── course/         # 课程系统
│   │   ├── leaderboard/    # 排行榜系统
│   │   └── quiz/           # 题库系统
│   ├── shared/             # 共享资源
│   │   ├── components/     # 共享组件
│   │   ├── services/       # 共享服务
│   │   ├── utils/          # 工具函数
│   │   └── styles/         # 共享样式
│   ├── views/              # 认证相关视图
│   ├── config/             # 配置文件
│   ├── router/             # 路由配置
│   ├── App.vue             # 应用入口组件
│   └── main.ts             # 应用入口文件
├── .env                    # 环境变量
└── package.json            # 依赖配置
```

### 关键文件说明

- **apps/*/index.ts**: 每个应用的入口文件，定义路由和导出模块
- **shared/components/MacosTopBar.vue**: 顶部导航栏，类似macOS风格
- **shared/services/authService.ts**: 认证服务，处理登录、注册等
- **shared/services/apiService.ts**: API服务，处理与后端的通信
- **router/index.ts**: 路由配置，整合所有应用的路由

## 后端结构

后端采用FastAPI + SQLAlchemy开发，使用模块化的结构组织代码：

```
backend/
├── app/
│   ├── models/             # 数据模型
│   ├── routers/            # API路由
│   ├── schemas/            # 数据验证模式
│   ├── auth.py             # 认证相关
│   ├── config.py           # 配置文件
│   ├── database.py         # 数据库配置
│   └── main.py             # 应用入口
├── scripts/                # 脚本文件
│   └── migrate_db.py       # 数据库迁移脚本
├── requirements.txt        # 依赖配置
└── .env                    # 环境变量
```

### 关键文件说明

- **app/config.py**: 配置文件，包含数据库连接信息和表前缀配置
- **app/models/**: 数据模型，使用表前缀区分不同应用的表
- **scripts/migrate_db.py**: 数据库迁移脚本，用于将旧数据迁移到新表结构

## 数据库结构

系统使用PostgreSQL数据库，名称为`KorsonStudySystem`。表结构使用前缀区分不同应用：

1. **common_**: 公共表，如用户表
   - common_users: 用户表
   
2. **study_**: 学习追踪系统表
   - study_tasks: 任务表
   - study_plans: 计划表
   - study_achievements: 成就表
   
3. **course_**: 课程系统表（待开发）
   - course_courses: 课程表
   - course_lessons: 课程内容表
   - course_progress: 学习进度表
   
4. **rank_**: 排行榜系统表（待开发）
   - rank_leaderboards: 排行榜表
   - rank_scores: 分数表
   
5. **quiz_**: 题库系统表（待开发）
   - quiz_questions: 题目表
   - quiz_answers: 答案表
   - quiz_attempts: 答题记录表

## 开发指南

### 添加新功能到现有应用

1. 在对应应用的目录下创建组件、服务或视图
2. 在应用的入口文件中添加路由
3. 如需添加新表，在后端创建模型并使用对应的表前缀

### 创建新应用

1. 在`frontend/src/apps/`下创建新应用目录
2. 创建入口文件、组件、服务和视图
3. 在`router/index.ts`中导入并添加新应用的路由
4. 在`MacosTopBar.vue`中添加新应用的导航链接
5. 在后端添加新的表前缀和模型

### 部署

详细的部署指南请参考`DEPLOYMENT.md`文件。

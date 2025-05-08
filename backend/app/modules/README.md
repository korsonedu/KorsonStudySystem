# 模块化结构说明

本项目采用模块化结构，将不同功能的模型和业务逻辑分离到各自的模块中，以提高代码的可维护性和可扩展性。

## 模块结构

### 公共模块 (common)

`app/modules/common` 包含所有模块共享的模型和功能：

- `models/user.py`: 用户模型，被所有其他模块引用

### 学习追踪模块 (study)

`app/modules/study` 包含学习追踪系统的模型和功能：

- `models/task.py`: 任务模型
- `models/plan.py`: 计划模型
- `models/achievement.py`: 成就模型

### 课程模块 (course)

`app/modules/course` 包含课程系统的模型和功能（待实现）

### 排行榜模块 (leaderboard)

`app/modules/leaderboard` 包含排行榜系统的模型和功能（待实现）

### 题库模块 (quiz)

`app/modules/quiz` 包含题库系统的模型和功能（待实现）

## 导入规则

- 从其他模块导入模型时，应使用以下格式：
  ```python
  from app.modules.study.models import Task, Plan, Achievement
  from app.modules.common.models import User
  ```

- 每个模块的 `__init__.py` 文件应导出该模块的所有公共接口，以便其他模块可以方便地导入。

## 数据库表前缀

每个模块的数据库表使用不同的前缀，以避免表名冲突：

- 公共模块: `common_`
- 学习追踪模块: `study_`
- 课程模块: `course_`
- 排行榜模块: `rank_`
- 题库模块: `quiz_`

这些前缀在 `app/core/config.py` 中定义。

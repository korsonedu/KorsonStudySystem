# backend/app/routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.auth import get_current_active_user
from app.database import get_db
from datetime import datetime

router = APIRouter()

# 获取用户的所有任务
@router.get("/", response_model=None)  # 移除响应模型限制
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 添加日志记录
        print(f"Fetching tasks for user: {current_user.username} (ID: {current_user.id})")

        # 查询任务
        tasks = db.query(Task).filter(Task.user_id == current_user.id).offset(skip).limit(limit).all()

        # 记录找到的任务数量
        print(f"Found {len(tasks)} tasks for user {current_user.username}")

        # 将每个任务转换为字典
        result_tasks = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "name": task.name,
                "duration": task.duration,
                "completed": task.completed if task.completed is not None else False,
                "user_id": task.user_id,
                "start": task.start.isoformat() if task.start else None,
                "end": task.end.isoformat() if task.end else None
            }
            result_tasks.append(task_dict)

        return result_tasks
    except Exception as e:
        # 记录错误
        print(f"Error in read_tasks for user {current_user.username}: {str(e)}")
        # 重新抛出异常，让FastAPI处理
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# 创建新任务
@router.post("/", response_model=None)  # 移除响应模型限制
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 记录任务创建请求
        print(f"Creating task for user: {current_user.username} (ID: {current_user.id})")

        task_data = task.model_dump()

        # 如果start和end是字符串,则转换为datetime对象
        try:
            if isinstance(task_data['start'], str):
                task_data['start'] = datetime.fromisoformat(task_data['start'])
            if isinstance(task_data['end'], str):
                task_data['end'] = datetime.fromisoformat(task_data['end'])
        except ValueError as e:
            print(f"Date parsing error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

        # 创建任务对象
        db_task = Task(**task_data, user_id=current_user.id)

        # 保存到数据库
        db.add(db_task)
        db.commit()
        db.refresh(db_task)

        print(f"Task created successfully with ID: {db_task.id}")

        # 创建返回结果
        result = {
            "id": db_task.id,
            "name": db_task.name,
            "duration": db_task.duration,
            "completed": db_task.completed if db_task.completed is not None else False,
            "user_id": db_task.user_id,
            "start": db_task.start.isoformat() if db_task.start else None,
            "end": db_task.end.isoformat() if db_task.end else None
        }

        return result
    except Exception as e:
        # 回滚事务
        db.rollback()
        # 记录错误
        print(f"Error in create_task for user {current_user.username}: {str(e)}")
        # 重新抛出异常
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

# 更新任务
@router.put("/{task_id}", response_model=None)  # 移除响应模型限制
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 查找任务
        db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")

        task_data = task.model_dump(exclude_unset=True)

        # 处理日期时间字段
        if "start" in task_data and task_data["start"] is not None:
            if isinstance(task_data["start"], str):
                db_task.start = datetime.fromisoformat(task_data["start"])
            else:
                db_task.start = task_data["start"]

        if "end" in task_data and task_data["end"] is not None:
            if isinstance(task_data["end"], str):
                db_task.end = datetime.fromisoformat(task_data["end"])
            else:
                db_task.end = task_data["end"]

        # 处理其他字段
        for field in ["name", "duration", "completed"]:
            if field in task_data:
                setattr(db_task, field, task_data[field])

        db.commit()
        db.refresh(db_task)

        # 创建返回结果
        result = {
            "id": db_task.id,
            "name": db_task.name,
            "duration": db_task.duration,
            "completed": db_task.completed if db_task.completed is not None else False,
            "user_id": db_task.user_id,
            "start": db_task.start.isoformat() if db_task.start else None,
            "end": db_task.end.isoformat() if db_task.end else None
        }

        return result
    except Exception as e:
        # 回滚事务
        db.rollback()
        # 记录错误
        print(f"Error in update_task for user {current_user.username}: {str(e)}")
        # 重新抛出异常
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

# 删除任务
@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 查找任务
        db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")

        # 删除任务
        db.delete(db_task)
        db.commit()

        return {"message": "Task deleted successfully"}
    except Exception as e:
        # 回滚事务
        db.rollback()
        # 记录错误
        print(f"Error in delete_task for user {current_user.username}: {str(e)}")
        # 重新抛出异常
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

# 获取今日任务
@router.get("/today", response_model=None)
def get_today_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 获取今天的日期范围
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # 查询今日任务
        tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.start >= today_start,
            Task.start <= today_end
        ).all()

        # 将任务转换为字典
        result_tasks = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "name": task.name,
                "duration": task.duration,
                "completed": task.completed if task.completed is not None else False,
                "user_id": task.user_id,
                "start": task.start.isoformat() if task.start else None,
                "end": task.end.isoformat() if task.end else None,
                "category": "学习"  # 默认分类，实际应用中可以从数据库获取
            }
            result_tasks.append(task_dict)

        return result_tasks
    except Exception as e:
        # 记录错误
        print(f"Error in get_today_tasks for user {current_user.username}: {str(e)}")
        # 重新抛出异常
        raise HTTPException(status_code=500, detail=f"Failed to get today's tasks: {str(e)}")

# 添加一个调试路由来直接检查任务表
@router.get("/debug", response_model=None)
def debug_tasks(db: Session = Depends(get_db)):
    try:
        # 检查Task表结构
        tasks = db.query(Task).limit(10).all()
        task_info = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "name": task.name,
                "user_id": task.user_id,
                "duration": task.duration,
                "start": str(task.start) if task.start else None,
                "end": str(task.end) if task.end else None,
                "completed": task.completed,
            }
            task_info.append(task_dict)

        # 获取用户信息
        users = db.query(User).filter(User.id.in_([task.user_id for task in tasks])).all()
        user_info = {user.id: user.username for user in users}

        return {
            "status": "success",
            "table_info": {
                "tablename": Task.__tablename__,
                "columns": [column.name for column in Task.__table__.columns],
            },
            "users": user_info,
            "sample_data": task_info if task_info else "No tasks found"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "type": str(type(e)),
        }

# 添加一个调试路由来检查特定用户的任务
@router.get("/debug/user/{username}", response_model=None)
def debug_user_tasks(username: str, db: Session = Depends(get_db)):
    try:
        # 查找用户
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return {
                "status": "error",
                "message": f"User '{username}' not found"
            }

        # 查询该用户的所有任务
        tasks = db.query(Task).filter(Task.user_id == user.id).all()

        # 格式化任务数据
        task_info = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "name": task.name,
                "user_id": task.user_id,
                "duration": task.duration,
                "start": str(task.start) if task.start else None,
                "end": str(task.end) if task.end else None,
                "completed": task.completed,
            }
            task_info.append(task_dict)

        return {
            "status": "success",
            "user_info": {
                "id": user.id,
                "username": user.username,
                "is_active": user.is_active,
                "created_at": str(user.created_at) if user.created_at else None
            },
            "tasks_count": len(tasks),
            "tasks": task_info
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "type": str(type(e)),
        }

# 添加一个专门针对 testuser 的调试端点
@router.get("/debug/testuser", response_model=None)
def debug_testuser(db: Session = Depends(get_db)):
    try:
        # 查找 testuser 用户
        testuser = db.query(User).filter(User.username == "testuser").first()
        if not testuser:
            return {
                "status": "error",
                "message": "testuser not found in database"
            }

        # 查询该用户的所有任务
        tasks = db.query(Task).filter(Task.user_id == testuser.id).all()

        # 格式化任务数据
        task_info = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "name": task.name,
                "user_id": task.user_id,
                "duration": task.duration,
                "start": str(task.start) if task.start else None,
                "end": str(task.end) if task.end else None,
                "completed": task.completed,
            }
            task_info.append(task_dict)

        # 尝试直接创建一个测试任务
        try:
            test_task = Task(
                name="Debug Test Task",
                duration=25,
                start=datetime.now(),
                end=datetime.now(),
                completed=True,
                user_id=testuser.id
            )
            db.add(test_task)
            db.commit()
            db.refresh(test_task)
            test_result = "Success"
        except Exception as e:
            db.rollback()
            test_result = f"Failed: {str(e)}"

        return {
            "status": "success",
            "user_info": {
                "id": testuser.id,
                "username": testuser.username,
                "is_active": testuser.is_active,
                "created_at": str(testuser.created_at) if testuser.created_at else None
            },
            "tasks_count": len(tasks),
            "tasks": task_info,
            "test_task_creation": test_result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "type": str(type(e)),
        }
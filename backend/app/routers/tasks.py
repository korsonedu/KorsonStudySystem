# backend/app/routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.modules.study.models import Task
from app.modules.common.models import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.auth import get_current_active_user
from app.database import get_db
from datetime import datetime
import pytz
from app.core.config import TIMEZONE

router = APIRouter()

# 获取用户的所有任务
@router.get("/", response_model=None)  # 移除响应模型限制
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 查询任务，按开始时间降序排序（最新的在前面）
        tasks = db.query(Task).filter(Task.user_id == current_user.id).order_by(Task.start.desc()).offset(skip).limit(limit).all()

        # 将每个任务转换为字典
        result_tasks = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "name": task.name,
                "duration": task.duration,
                "user_id": task.user_id,
                "start": task.start.isoformat() if task.start else None,
                "end": task.end.isoformat() if task.end else None,
                "completed": task.completed
            }
            result_tasks.append(task_dict)

        return result_tasks
    except Exception as e:
        # 重新抛出异常，让FastAPI处理
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# 创建新任务
@router.post("/", response_model=None)
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 确保任务是已完成的
        if not task.completed:
            raise HTTPException(status_code=400, detail="只能创建已完成的任务")

        # 确保任务有结束时间
        if not task.end:
            raise HTTPException(status_code=400, detail="已完成的任务必须有结束时间")

        # 创建新任务对象
        db_task = Task(
            name=task.name,
            duration=task.duration,
            start=task.start,
            end=task.end,
            user_id=current_user.id,
            completed=True  # 强制设置为已完成
        )
        
        # 保存到数据库
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        
        # 返回创建的任务
        return {
            "id": db_task.id,
            "name": db_task.name,
            "duration": db_task.duration,
            "user_id": db_task.user_id,
            "start": db_task.start.isoformat() if db_task.start else None,
            "end": db_task.end.isoformat() if db_task.end else None,
            "completed": db_task.completed
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

# 更新任务
@router.put("/{task_id}", response_model=None)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 查找任务
        db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # 更新任务属性
        for key, value in task.dict(exclude_unset=True).items():
            setattr(db_task, key, value)
        
        # 保存更改
        db.commit()
        db.refresh(db_task)
        
        # 返回更新后的任务
        return {
            "id": db_task.id,
            "name": db_task.name,
            "duration": db_task.duration,
            "user_id": db_task.user_id,
            "start": db_task.start.isoformat() if db_task.start else None,
            "end": db_task.end.isoformat() if db_task.end else None,
            "completed": db_task.completed
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

# 完成任务
@router.post("/{task_id}/complete", response_model=None)
def complete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 查找任务
        db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # 设置任务完成状态
        db_task.completed = True
        db_task.end = datetime.now(pytz.timezone(TIMEZONE))
        
        # 保存更改
        db.commit()
        db.refresh(db_task)
        
        # 返回更新后的任务
        return {
            "id": db_task.id,
            "name": db_task.name,
            "duration": db_task.duration,
            "user_id": db_task.user_id,
            "start": db_task.start.isoformat() if db_task.start else None,
            "end": db_task.end.isoformat() if db_task.end else None,
            "completed": db_task.completed
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to complete task: {str(e)}")

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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

# 获取今日任务
@router.get("/today", response_model=None)
def get_today_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 获取今天的日期范围（中国时区）
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # 查询今日任务，按开始时间降序排序（最新的在前面）
        tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.start >= today_start,
            Task.start <= today_end
        ).order_by(Task.start.desc()).all()

        # 将任务转换为字典
        result_tasks = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "name": task.name,
                "duration": task.duration,
                "user_id": task.user_id,
                "start": task.start.isoformat() if task.start else None,
                "end": task.end.isoformat() if task.end else None,
                "category": "学习"  # 默认分类，实际应用中可以从数据库获取
            }
            result_tasks.append(task_dict)

        return result_tasks
    except Exception as e:
        # 重新抛出异常
        raise HTTPException(status_code=500, detail=f"Failed to get today's tasks: {str(e)}")


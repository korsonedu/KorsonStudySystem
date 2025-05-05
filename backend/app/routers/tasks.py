# backend/app/routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.user import User
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
                "completed": task.completed if task.completed is not None else False,
                "user_id": task.user_id,
                "start": task.start.isoformat() if task.start else None,
                "end": task.end.isoformat() if task.end else None
            }
            result_tasks.append(task_dict)

        return result_tasks
    except Exception as e:
        # 重新抛出异常，让FastAPI处理
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# 创建新任务
@router.post("/", response_model=None)  # 移除响应模型限制
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        task_data = task.model_dump()

        # 如果start和end是字符串,则转换为datetime对象
        try:
            # 获取中国时区
            china_tz = pytz.timezone(TIMEZONE)

            if isinstance(task_data['start'], str):
                start_str = task_data['start']
                try:
                    # 尝试使用dateutil解析（更灵活的解析器）
                    from dateutil import parser
                    parsed_date = parser.parse(start_str)

                    # 如果解析的日期有时区信息，转换为中国时区
                    if parsed_date.tzinfo is not None:
                        parsed_date = parsed_date.astimezone(china_tz)

                    # 移除时区信息（数据库存储无时区日期）
                    task_data['start'] = parsed_date.replace(tzinfo=None)
                except Exception as parse_error:
                    raise HTTPException(status_code=400, detail=f"Invalid start date format: {start_str}")

            if isinstance(task_data['end'], str):
                end_str = task_data['end']
                try:
                    # 尝试使用dateutil解析（更灵活的解析器）
                    from dateutil import parser
                    parsed_date = parser.parse(end_str)

                    # 如果解析的日期有时区信息，转换为中国时区
                    if parsed_date.tzinfo is not None:
                        parsed_date = parsed_date.astimezone(china_tz)

                    # 移除时区信息（数据库存储无时区日期）
                    task_data['end'] = parsed_date.replace(tzinfo=None)
                except Exception as parse_error:
                    raise HTTPException(status_code=400, detail=f"Invalid end date format: {end_str}")

        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

        # 确保不指定ID，让数据库自动生成
        if 'id' in task_data:
            del task_data['id']

        # 创建任务对象
        db_task = Task(**task_data, user_id=current_user.id)

        # 保存到数据库
        db.add(db_task)

        try:
            db.commit()
            db.refresh(db_task)
        except Exception as e:
            db.rollback()
            # 不再尝试重置序列，让数据库自动处理
            raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")



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

        # 处理日期时间字段（中国时区）
        # 获取中国时区
        china_tz = pytz.timezone(TIMEZONE)

        if "start" in task_data and task_data["start"] is not None:
            if isinstance(task_data["start"], str):
                start_str = task_data["start"]
                if start_str.endswith('Z'):
                    # 如果是UTC时间（带Z后缀），先解析为UTC时间，然后转换为中国时区
                    utc_time = datetime.fromisoformat(start_str[:-1])
                    utc_time = utc_time.replace(tzinfo=pytz.UTC)
                    db_task.start = utc_time.astimezone(china_tz).replace(tzinfo=None)
                else:
                    # 如果没有时区信息，假设已经是中国时区
                    db_task.start = datetime.fromisoformat(start_str)
            else:
                db_task.start = task_data["start"]

        if "end" in task_data and task_data["end"] is not None:
            if isinstance(task_data["end"], str):
                end_str = task_data["end"]
                if end_str.endswith('Z'):
                    # 如果是UTC时间（带Z后缀），先解析为UTC时间，然后转换为中国时区
                    utc_time = datetime.fromisoformat(end_str[:-1])
                    utc_time = utc_time.replace(tzinfo=pytz.UTC)
                    db_task.end = utc_time.astimezone(china_tz).replace(tzinfo=None)
                else:
                    # 如果没有时区信息，假设已经是中国时区
                    db_task.end = datetime.fromisoformat(end_str)
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
        # 重新抛出异常
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
                "completed": task.completed if task.completed is not None else False,
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


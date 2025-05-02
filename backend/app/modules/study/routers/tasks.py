# backend/app/modules/study/routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.modules.study.models.task import Task
from app.modules.common.models.user import User
from app.modules.common.routers.auth import get_current_active_user
from app.modules.study.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from datetime import datetime
import pytz
from app.config import TIMEZONE

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=TaskResponse)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建新任务"""
    try:
        # 如果start和end是字符串,则转换为datetime对象
        try:
            if isinstance(task_data['start'], str):
                try:
                    # 尝试解析带有时区信息的日期字符串
                    from dateutil import parser
                    parsed_date = parser.parse(task_data['start'])
                    # 转换为无时区的datetime对象
                    task_data['start'] = parsed_date.replace(tzinfo=None)
                    print(f"Successfully parsed start time with dateutil: {task_data['start']}")
                except Exception as parse_error:
                    print(f"Error parsing with dateutil: {str(parse_error)}")
                    # 如果解析失败，尝试使用fromisoformat
                    if '+' in task_data['start']:
                        # 处理带有+08:00等时区信息的ISO格式字符串
                        # 移除时区信息，因为我们已经在中国时区
                        task_data['start'] = task_data['start'].split('+')[0]
                    elif 'Z' in task_data['start']:
                        # 处理带有Z后缀的ISO格式字符串
                        task_data['start'] = task_data['start'].replace('Z', '')
                    task_data['start'] = datetime.fromisoformat(task_data['start'])
                    print(f"Parsed start time with fromisoformat: {task_data['start']}")

            if isinstance(task_data['end'], str):
                try:
                    # 尝试解析带有时区信息的日期字符串
                    from dateutil import parser
                    parsed_date = parser.parse(task_data['end'])
                    # 转换为无时区的datetime对象
                    task_data['end'] = parsed_date.replace(tzinfo=None)
                    print(f"Successfully parsed end time with dateutil: {task_data['end']}")
                except Exception as parse_error:
                    print(f"Error parsing with dateutil: {str(parse_error)}")
                    # 如果解析失败，尝试使用fromisoformat
                    if '+' in task_data['end']:
                        # 处理带有+08:00等时区信息的ISO格式字符串
                        # 移除时区信息，因为我们已经在中国时区
                        task_data['end'] = task_data['end'].split('+')[0]
                    elif 'Z' in task_data['end']:
                        # 处理带有Z后缀的ISO格式字符串
                        task_data['end'] = task_data['end'].replace('Z', '')
                    task_data['end'] = datetime.fromisoformat(task_data['end'])
                    print(f"Parsed end time with fromisoformat: {task_data['end']}")

            print(f"Final start time: {task_data['start']}")
            print(f"Final end time: {task_data['end']}")
        except ValueError as e:
            print(f"Date parsing error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

        # 创建任务
        db_task = Task(
            name=task_data["name"],
            duration=task_data["duration"],
            start=task_data["start"],
            end=task_data["end"],
            completed=task_data.get("completed", True),
            user_id=current_user.id
        )

        db.add(db_task)
        db.commit()
        db.refresh(db_task)

        return {
            "id": db_task.id,
            "name": db_task.name,
            "duration": db_task.duration,
            "start": db_task.start,
            "end": db_task.end,
            "completed": db_task.completed,
            "user_id": db_task.user_id
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@router.get("/", response_model=list[TaskResponse])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的所有任务"""
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    return tasks

@router.get("/today", response_model=list[TaskResponse])
def get_today_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的今日任务"""
    try:
        # 获取今天的日期范围（中国时区）
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # 查询今天的任务
        tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.start >= today_start,
            Task.end <= today_end
        ).all()

        return tasks
    except Exception as e:
        print(f"Error getting today's tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting today's tasks: {str(e)}")

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取指定ID的任务"""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新指定ID的任务"""
    db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
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

        # 更新其他字段
        if "name" in task_data:
            db_task.name = task_data["name"]
        if "duration" in task_data:
            db_task.duration = task_data["duration"]
        if "completed" in task_data:
            db_task.completed = task_data["completed"]

        db.commit()
        db.refresh(db_task)

        return db_task
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除指定ID的任务"""
    db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        db.delete(db_task)
        db.commit()
        return {"message": "Task deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")

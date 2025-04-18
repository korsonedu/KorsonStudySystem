# backend/app/routers/statistics.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.task import Task
from app.models.user import User
from app.auth import get_current_active_user
from app.database import get_db  # 确保正确导入 get_db

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/user-stats")
def get_user_statistics(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # 查询用户的所有任务
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    
    # 计算统计信息
    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.completed)
    total_duration = sum(task.duration for task in tasks if task.completed)
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "total_duration": total_duration
    }
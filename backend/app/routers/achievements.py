# backend/app/routers/achievements.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct
from datetime import datetime, time, timedelta
from app.models.achievement import Achievement
from app.models.user import User
from app.models.task import Task
from app.models.plan import Plan
from app.schemas.achievement import AchievementCreate, AchievementUpdate, AchievementResponse
from app.auth import get_current_superuser, get_current_active_user
from app.database import get_db
from app.achievements_definitions import ACHIEVEMENTS, get_achievement_by_id
from typing import List, Dict, Any

router = APIRouter()

# 获取所有成就（仅管理员）
@router.get("/admin", response_model=list[AchievementResponse])
def read_achievements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _: User = Depends(get_current_superuser)):
    achievements = db.query(Achievement).offset(skip).limit(limit).all()

    # 转换日期时间为字符串
    for achievement in achievements:
        if achievement.unlocked_at:
            achievement.unlocked_at = achievement.unlocked_at.isoformat()

    return achievements

# 创建新成就（仅管理员）
@router.post("/admin", response_model=AchievementResponse)
def create_achievement(achievement: AchievementCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_superuser)):
    db_achievement = Achievement(**achievement.model_dump(), user_id=admin.id)
    db.add(db_achievement)
    db.commit()
    db.refresh(db_achievement)

    # 转换日期时间为字符串
    if db_achievement.unlocked_at:
        db_achievement.unlocked_at = db_achievement.unlocked_at.isoformat()

    return db_achievement

# 更新成就（仅管理员）
@router.put("/admin/{achievement_id}", response_model=AchievementResponse)
def update_achievement(achievement_id: int, achievement: AchievementUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_superuser)):
    db_achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not db_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    if achievement.type is not None:
        db_achievement.type = achievement.type
    if achievement.level is not None:
        db_achievement.level = achievement.level
    db.commit()
    db.refresh(db_achievement)

    # 转换日期时间为字符串
    if db_achievement.unlocked_at:
        db_achievement.unlocked_at = db_achievement.unlocked_at.isoformat()

    return db_achievement

# 删除成就（仅管理员）
@router.delete("/admin/{achievement_id}")
def delete_achievement(achievement_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_superuser)):
    db_achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not db_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    db.delete(db_achievement)
    db.commit()
    return {"message": "Achievement deleted successfully"}

# 获取用户统计数据
def get_user_stats(user_id: int, db: Session) -> Dict[str, Any]:
    """获取用户的统计数据，用于成就解锁判断"""
    # 获取用户的所有任务
    tasks = db.query(Task).filter(Task.user_id == user_id).all()

    # 获取用户的所有计划
    plans = db.query(Plan).filter(Plan.user_id == user_id).all()

    # 初始化统计数据
    stats = {
        "total_tasks": len(tasks),
        "total_minutes": sum(task.duration for task in tasks if task.duration),
        "night_tasks": 0,
        "early_tasks": 0,
        "streak_days": 0,
        "total_plans": len(plans),
        "completed_plans": len([plan for plan in plans if plan.completed]),
        "long_tasks": len([task for task in tasks if task.duration and task.duration >= 25]),
        "weekend_tasks": 0,
        "max_daily_tasks": 0
    }

    # 计算夜间任务数量（晚上10点后）
    night_time = time(22, 0)
    stats["night_tasks"] = len([
        task for task in tasks
        if task.start and task.start.time() >= night_time
    ])

    # 计算早起任务数量（早上6点前）
    early_time = time(6, 0)
    stats["early_tasks"] = len([
        task for task in tasks
        if task.start and task.start.time() < early_time
    ])

    # 计算周末任务数量
    stats["weekend_tasks"] = len([
        task for task in tasks
        if task.start and task.start.weekday() >= 5  # 5=Saturday, 6=Sunday
    ])

    # 计算单日最大任务数量
    if tasks:
        # 按日期分组任务
        daily_tasks = {}
        for task in tasks:
            if task.start:
                date_str = task.start.date().isoformat()
                if date_str in daily_tasks:
                    daily_tasks[date_str] += 1
                else:
                    daily_tasks[date_str] = 1

        # 获取单日最大任务数量
        if daily_tasks:
            stats["max_daily_tasks"] = max(daily_tasks.values())

    # 计算连续学习天数
    if tasks:
        # 获取所有有任务的日期
        task_dates = sorted(set(task.start.date() for task in tasks if task.start))

        if task_dates:
            # 计算最长连续天数
            max_streak = current_streak = 1
            for i in range(1, len(task_dates)):
                if (task_dates[i] - task_dates[i-1]).days == 1:
                    current_streak += 1
                else:
                    max_streak = max(max_streak, current_streak)
                    current_streak = 1

            stats["streak_days"] = max(max_streak, current_streak)

    return stats

# 获取用户的成就
@router.get("/", response_model=None)
def get_user_achievements(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 获取用户的统计数据
        user_stats = get_user_stats(current_user.id, db)

        # 获取用户已解锁的成就
        user_achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).all()

        # 将已解锁的成就转换为字典，方便查找
        unlocked_achievements = {}
        for achievement in user_achievements:
            if achievement.type not in unlocked_achievements or achievement.level > unlocked_achievements[achievement.type]["level"]:
                unlocked_achievements[achievement.type] = {
                    "id": achievement.id,
                    "type": achievement.type,
                    "level": achievement.level,
                    "unlocked_at": achievement.unlocked_at.isoformat() if achievement.unlocked_at else None
                }

        # 检查所有成就的解锁状态
        achievements_status = []
        for achievement_def in ACHIEVEMENTS:
            achievement_id = achievement_def["id"]
            achievement_type = f"achievement_{achievement_id}"

            # 检查每个等级的解锁状态
            levels_status = []
            highest_unlocked_level = 0

            for level_def in achievement_def["levels"]:
                level = level_def["level"]
                # 检查是否满足解锁条件
                is_unlocked = level_def["condition"](user_stats)

                # 如果已解锁但数据库中没有记录，则添加记录
                if is_unlocked and (achievement_type not in unlocked_achievements or unlocked_achievements[achievement_type]["level"] < level):
                    # 创建或更新成就记录
                    db_achievement = db.query(Achievement).filter(
                        Achievement.user_id == current_user.id,
                        Achievement.type == achievement_type
                    ).first()

                    if db_achievement:
                        db_achievement.level = level
                    else:
                        db_achievement = Achievement(
                            user_id=current_user.id,
                            type=achievement_type,
                            level=level
                        )
                        db.add(db_achievement)

                    db.commit()
                    db.refresh(db_achievement)

                    # 更新解锁记录
                    if achievement_type not in unlocked_achievements or unlocked_achievements[achievement_type]["level"] < level:
                        unlocked_achievements[achievement_type] = {
                            "id": db_achievement.id,
                            "type": achievement_type,
                            "level": level,
                            "unlocked_at": db_achievement.unlocked_at.isoformat() if db_achievement.unlocked_at else None
                        }

                # 如果数据库中有记录但不满足条件，则删除记录（成就回收）
                if not is_unlocked and achievement_type in unlocked_achievements and unlocked_achievements[achievement_type]["level"] >= level:
                    db_achievement = db.query(Achievement).filter(
                        Achievement.user_id == current_user.id,
                        Achievement.type == achievement_type,
                        Achievement.level == level
                    ).first()

                    if db_achievement:
                        db.delete(db_achievement)
                        db.commit()

                        # 更新解锁记录
                        if level == unlocked_achievements[achievement_type]["level"]:
                            # 查找是否有更低级别的成就
                            lower_achievement = db.query(Achievement).filter(
                                Achievement.user_id == current_user.id,
                                Achievement.type == achievement_type
                            ).order_by(Achievement.level.desc()).first()

                            if lower_achievement:
                                unlocked_achievements[achievement_type] = {
                                    "id": lower_achievement.id,
                                    "type": achievement_type,
                                    "level": lower_achievement.level,
                                    "unlocked_at": lower_achievement.unlocked_at.isoformat() if lower_achievement.unlocked_at else None
                                }
                            else:
                                unlocked_achievements.pop(achievement_type, None)

                # 记录解锁状态
                level_status = {
                    "level": level,
                    "unlocked": is_unlocked,
                    "unlocked_at": unlocked_achievements.get(achievement_type, {}).get("unlocked_at") if is_unlocked else None
                }
                levels_status.append(level_status)

                if is_unlocked:
                    highest_unlocked_level = max(highest_unlocked_level, level)

            # 添加成就状态
            achievement_status = {
                "id": achievement_id,
                "name": achievement_def["name"],
                "description": achievement_def["description"],
                "highest_level": highest_unlocked_level,
                "is_unlocked": highest_unlocked_level > 0,
                "levels": levels_status
            }
            achievements_status.append(achievement_status)

        return {
            "status": "success",
            "achievements": achievements_status,
            "user_stats": user_stats
        }
    except Exception as e:
        print(f"Error in get_user_achievements: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get achievements: {str(e)}")
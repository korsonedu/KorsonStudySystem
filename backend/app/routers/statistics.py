# backend/app/routers/statistics.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from app.models.task import Task
from app.models.user import User
from app.auth import get_current_active_user
from app.database import get_db
import pytz
from app.core.config import TIMEZONE
from typing import List, Dict, Any

router = APIRouter()

# 获取用户基本统计数据（根路径）
@router.get("/", response_model=Dict[str, Any])
def get_basic_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 获取今天的日期范围（中国时区）
    china_tz = pytz.timezone(TIMEZONE)
    now = datetime.now(china_tz)
    today = now.date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # 查询今日任务总时长
    daily_duration = db.query(func.sum(Task.duration)).filter(
        Task.user_id == current_user.id,
        Task.start >= today_start,
        Task.start <= today_end
    ).scalar() or 0

    # 查询所有任务总时长
    total_minutes = db.query(func.sum(Task.duration)).filter(
        Task.user_id == current_user.id
    ).scalar() or 0

    # 查询总任务数
    total_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == current_user.id
    ).scalar() or 0

    # 转换为小时
    total_hours = round(total_minutes / 60, 1)

    return {
        "daily_duration": daily_duration,
        "total_hours": total_hours,
        "total_minutes": total_minutes,
        "total_tasks": total_tasks
    }

# 获取用户总计统计数据
@router.get("/total", response_model=Dict[str, Any])
def get_total_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 查询所有任务总时长
    total_minutes = db.query(func.sum(Task.duration)).filter(
        Task.user_id == current_user.id
    ).scalar() or 0

    # 查询总任务数
    total_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == current_user.id
    ).scalar() or 0

    # 转换为小时
    total_hours = round(total_minutes / 60, 1)

    return {
        "total_tasks": total_tasks,
        "total_minutes": total_minutes,
        "total_hours": total_hours
    }

# 获取用户每日统计数据
@router.get("/daily", response_model=Dict[str, Any])
def get_daily_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 获取今天的日期范围（中国时区）
    china_tz = pytz.timezone(TIMEZONE)
    now = datetime.now(china_tz)
    today = now.date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # 查询今日任务总时长
    total_duration = db.query(func.sum(Task.duration)).filter(
        Task.user_id == current_user.id,
        Task.start >= today_start,
        Task.start <= today_end
    ).scalar() or 0

    # 查询每小时的任务时长
    hourly_stats = db.query(
        func.extract('hour', Task.start).label('hour'),
        func.sum(Task.duration).label('duration')
    ).filter(
        Task.user_id == current_user.id,
        Task.start >= today_start,
        Task.start <= today_end
    ).group_by(func.extract('hour', Task.start)).all()

    # 转换为前端期望的格式
    hourly_data = []
    for stat in hourly_stats:
        hour = int(stat.hour)
        hour_str = f"{hour:02d}:00"
        hourly_data.append({
            "time": hour_str,
            "duration": stat.duration
        })

    return {
        "duration": total_duration,
        "hourly": hourly_data
    }

# 获取用户每周统计数据
@router.get("/weekly", response_model=Dict[str, Any])
def get_weekly_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 获取本周的日期范围（中国时区）
    china_tz = pytz.timezone(TIMEZONE)
    now = datetime.now(china_tz)
    today = now.date()

    # 计算本周的开始日期（周一）和结束日期（周日）
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    week_start = datetime.combine(start_of_week, datetime.min.time())
    week_end = datetime.combine(end_of_week, datetime.max.time())

    # 查询本周任务总时长
    total_duration = db.query(func.sum(Task.duration)).filter(
        Task.user_id == current_user.id,
        Task.start >= week_start,
        Task.start <= week_end
    ).scalar() or 0

    # 按日期分组查询每天的任务时长
    daily_stats = db.query(
        func.date(Task.start).label('date'),
        func.sum(Task.duration).label('duration')
    ).filter(
        Task.user_id == current_user.id,
        Task.start >= week_start,
        Task.start <= week_end
    ).group_by(func.date(Task.start)).all()

    # 转换为字典列表
    daily_data = []
    for stat in daily_stats:
        # 获取星期几的名称
        day_name = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][stat.date.weekday()]
        daily_data.append({
            "date": stat.date.isoformat(),
            "day": day_name,
            "duration": stat.duration
        })

    return {
        "total_duration": total_duration,
        "daily": daily_data,
        "week_start": start_of_week.isoformat(),
        "week_end": end_of_week.isoformat()
    }

# 获取用户每月统计数据
@router.get("/monthly", response_model=Dict[str, Any])
def get_monthly_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 获取本月的日期范围（中国时区）
    china_tz = pytz.timezone(TIMEZONE)
    now = datetime.now(china_tz)

    # 计算本月的开始日期和结束日期
    year = now.year
    month = now.month
    first_day = date(year, month, 1)

    # 获取下个月的第一天，然后减去一天得到本月的最后一天
    if month == 12:
        last_day = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(year, month + 1, 1) - timedelta(days=1)

    month_start = datetime.combine(first_day, datetime.min.time())
    month_end = datetime.combine(last_day, datetime.max.time())

    # 查询本月任务总时长
    total_duration = db.query(func.sum(Task.duration)).filter(
        Task.user_id == current_user.id,
        Task.start >= month_start,
        Task.start <= month_end
    ).scalar() or 0

    # 按日期分组查询每天的任务时长
    daily_stats = db.query(
        func.date(Task.start).label('date'),
        func.sum(Task.duration).label('duration')
    ).filter(
        Task.user_id == current_user.id,
        Task.start >= month_start,
        Task.start <= month_end
    ).group_by(func.date(Task.start)).all()

    # 转换为字典列表
    daily_data = []
    for stat in daily_stats:
        # 获取日期的天数
        day = stat.date.day
        daily_data.append({
            "date": stat.date.isoformat(),
            "day": f"{day}日",
            "duration": stat.duration
        })

    return {
        "total_duration": total_duration,
        "daily": daily_data,
        "month_start": first_day.isoformat(),
        "month_end": last_day.isoformat()
    }

# 获取热力图数据
@router.get("/heatmap", response_model=List[Dict[str, Any]])
def get_heatmap_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 获取中国时区
    china_tz = pytz.timezone(TIMEZONE)
    now = datetime.now(china_tz)
    today = now.date()

    # 使用用户注册日期作为起始日期
    registration_date = current_user.created_at.date()

    # 计算结束日期为注册日期次年的3月31日
    registration_year = registration_date.year
    end_date = date(registration_year + 1, 3, 31)

    # 如果结束日期已经过去，使用今天作为结束日期
    if end_date < today:
        end_date = today

    # 查询从注册日期到结束日期的每天任务总时长
    daily_stats = db.query(
        func.date(Task.start).label('date'),
        func.sum(Task.duration).label('duration')
    ).filter(
        Task.user_id == current_user.id,
        Task.start >= datetime.combine(registration_date, datetime.min.time()),
        Task.start <= datetime.combine(end_date, datetime.max.time())
    ).group_by(func.date(Task.start)).all()

    # 转换为前端期望的格式
    heatmap_data = []
    for stat in daily_stats:
        heatmap_data.append({
            "date": stat.date.isoformat(),
            "duration": stat.duration  # 直接使用时长，不再转换为单位
        })

    return heatmap_data

# 获取时间分布数据
@router.get("/time-distribution", response_model=Dict[str, List[Dict[str, Any]]])
def get_time_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 获取过去90天的日期范围
    china_tz = pytz.timezone(TIMEZONE)
    now = datetime.now(china_tz)
    today = now.date()
    past_90_days = today - timedelta(days=90)

    # 查询每小时的任务时长
    hourly_stats = db.query(
        func.extract('hour', Task.start).label('hour'),
        func.sum(Task.duration).label('duration'),
        func.count(Task.id).label('count')
    ).filter(
        Task.user_id == current_user.id,
        Task.start >= datetime.combine(past_90_days, datetime.min.time()),
        Task.start <= datetime.combine(today, datetime.max.time())
    ).group_by(func.extract('hour', Task.start)).all()

    # 转换为前端期望的格式，确保所有24小时都有数据
    hourly_data = []
    for hour in range(24):
        stat = next((s for s in hourly_stats if int(s.hour) == hour), None)
        hourly_data.append({
            "hour": hour,
            "duration": stat.duration if stat else 0,
            "count": stat.count if stat else 0,
            "time": f"{hour:02d}:00"  # 添加时间字符串格式
        })

    return {"hourly": hourly_data}

# 获取用户统计数据
@router.get("/user", response_model=Dict[str, Any])
def get_user_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 获取用户的任务统计
    total_tasks = db.query(func.count(Task.id)).filter(Task.user_id == current_user.id).scalar() or 0
    total_duration = db.query(func.sum(Task.duration)).filter(Task.user_id == current_user.id).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(Task.user_id == current_user.id, Task.completed == True).scalar() or 0

    # 计算连续学习天数
    streak_days = calculate_streak_days(db, current_user.id)

    return {
        "total_tasks": total_tasks,
        "total_duration": total_duration,
        "total_hours": round(total_duration / 60, 1),
        "completed_tasks": completed_tasks,
        "completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0,
        "streak_days": streak_days,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

# 辅助函数：计算连续学习天数
def calculate_streak_days(db: Session, user_id: int) -> int:
    # 获取中国时区
    china_tz = pytz.timezone(TIMEZONE)
    now = datetime.now(china_tz)
    today = now.date()

    # 查询过去90天每天是否有学习记录
    day_records = db.query(
        func.date(Task.start).label('date')
    ).filter(
        Task.user_id == user_id,
        Task.start >= datetime.combine(today - timedelta(days=90), datetime.min.time()),
        Task.start <= datetime.combine(today, datetime.max.time())
    ).group_by(func.date(Task.start)).all()

    # 提取日期列表并排序
    study_dates = sorted([record.date for record in day_records], reverse=True)

    # 如果没有学习记录，返回0
    if not study_dates:
        return 0

    # 检查今天是否有学习记录
    has_today = today in study_dates

    # 计算连续学习天数
    streak = 1 if has_today else 0  # 如果今天有记录，从1开始计数

    # 如果今天没有记录但昨天有，从昨天开始计算
    start_idx = 0 if has_today else (1 if today - timedelta(days=1) in study_dates else -1)

    # 如果没有可计算的起始日期，返回0
    if start_idx == -1:
        return 0

    # 从起始日期开始向前检查连续性
    current_date = study_dates[start_idx]

    for i in range(start_idx + 1, len(study_dates)):
        # 如果下一个日期与当前日期相差1天，则连续
        if (current_date - study_dates[i]).days == 1:
            streak += 1
            current_date = study_dates[i]
        else:
            # 连续性中断
            break

    return streak

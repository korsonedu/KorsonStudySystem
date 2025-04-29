# backend/app/routers/statistics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
import collections

from app.models.task import Task
from app.models.user import User
from app.models.plan import Plan
from app.auth import get_current_active_user
from app.database import get_db

router = APIRouter()

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

# 获取每日统计数据
@router.get("/daily")
def get_daily_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 获取今天的开始时间
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)

    # 查询今天的任务
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.start >= today,
        Task.start < tomorrow,
        Task.completed == True
    ).all()

    # 按小时统计
    hours_data = []
    for hour in range(24):
        hour_start = today + timedelta(hours=hour)
        hour_end = today + timedelta(hours=hour + 1)

        # 筛选该小时内的任务
        hour_tasks = [t for t in tasks if hour_start <= t.start < hour_end]

        # 计算总时长
        total_duration = sum(t.duration for t in hour_tasks)

        hours_data.append({
            "time": f"{hour}:00",
            "duration": total_duration
        })

    # 按内容统计
    content_stats = {}
    for task in tasks:
        if task.name in content_stats:
            content_stats[task.name] += task.duration
        else:
            content_stats[task.name] = task.duration

    content_data = [{"name": name, "duration": duration} for name, duration in content_stats.items()]

    return {
        "hourly": hours_data,
        "content": content_data
    }

# 获取每周统计数据
@router.get("/weekly")
def get_weekly_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 获取本周的开始时间（周一）
    today = datetime.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    start_datetime = datetime.combine(start_of_week, datetime.min.time())
    end_datetime = start_datetime + timedelta(days=7)

    # 查询本周的任务
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.start >= start_datetime,
        Task.start < end_datetime,
        Task.completed == True
    ).all()

    # 按天统计
    days_data = []
    day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

    for i in range(7):
        day_start = start_datetime + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        # 筛选该天的任务
        day_tasks = [t for t in tasks if day_start <= t.start < day_end]

        # 计算总时长
        total_duration = sum(t.duration for t in day_tasks)

        days_data.append({
            "day": day_names[i],
            "duration": total_duration
        })

    # 按内容统计
    content_stats = {}
    for task in tasks:
        if task.name in content_stats:
            content_stats[task.name] += task.duration
        else:
            content_stats[task.name] = task.duration

    content_data = [{"name": name, "duration": duration} for name, duration in content_stats.items()]

    return {
        "daily": days_data,
        "content": content_data
    }

# 获取每月统计数据
@router.get("/monthly")
def get_monthly_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 获取本月的开始时间
    today = datetime.now()
    start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 计算下个月的开始时间
    if today.month == 12:
        next_month = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month = today.replace(month=today.month + 1, day=1)

    # 查询本月的任务
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.start >= start_of_month,
        Task.start < next_month,
        Task.completed == True
    ).all()

    # 按天统计
    days_in_month = (next_month - start_of_month).days
    days_data = []

    for i in range(days_in_month):
        day_start = start_of_month + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        # 筛选该天的任务
        day_tasks = [t for t in tasks if day_start <= t.start < day_end]

        # 计算总时长
        total_duration = sum(t.duration for t in day_tasks)

        days_data.append({
            "day": f"{day_start.day}日",
            "duration": total_duration
        })

    # 按内容统计
    content_stats = {}
    for task in tasks:
        if task.name in content_stats:
            content_stats[task.name] += task.duration
        else:
            content_stats[task.name] = task.duration

    content_data = [{"name": name, "duration": duration} for name, duration in content_stats.items()]

    return {
        "daily": days_data,
        "content": content_data
    }

# 获取总计统计数据
@router.get("/total")
def get_total_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 获取今天的开始时间
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)

    # 获取本周的开始时间（周一）
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=7)

    # 获取本月的开始时间
    start_of_month = today.replace(day=1)
    if today.month == 12:
        next_month = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month = today.replace(month=today.month + 1, day=1)

    # 查询所有任务
    all_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.completed == True
    ).all()

    # 筛选今天的任务
    daily_tasks = [t for t in all_tasks if today <= t.start < tomorrow]
    daily_minutes = sum(t.duration for t in daily_tasks)

    # 筛选本周的任务
    weekly_tasks = [t for t in all_tasks if start_of_week <= t.start < end_of_week]
    weekly_minutes = sum(t.duration for t in weekly_tasks)

    # 筛选本月的任务
    monthly_tasks = [t for t in all_tasks if start_of_month <= t.start < next_month]
    monthly_minutes = sum(t.duration for t in monthly_tasks)

    # 计算总学习时长（小时）
    total_minutes = sum(t.duration for t in all_tasks)
    total_hours = round(total_minutes / 60, 1)

    return {
        "dailyMinutes": daily_minutes,
        "weeklyMinutes": weekly_minutes,
        "monthlyMinutes": monthly_minutes,
        "totalHours": total_hours
    }

# 获取热力图数据
@router.get("/heatmap")
def get_heatmap_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 获取过去一年的开始时间
    today = datetime.now()
    one_year_ago = today - timedelta(days=365)

    # 查询过去一年的任务
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.start >= one_year_ago,
        Task.completed == True
    ).all()

    # 按日期统计
    date_stats = {}
    for task in tasks:
        date_str = task.start.strftime("%Y-%m-%d")
        if date_str in date_stats:
            date_stats[date_str] += task.duration
        else:
            date_stats[date_str] = task.duration

    # 转换为列表格式
    heatmap_data = [{"date": date, "value": value} for date, value in date_stats.items()]

    return heatmap_data

# 获取时间分布数据
@router.get("/time-distribution")
def get_time_distribution(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 查询所有任务
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.completed == True
    ).all()

    # 按小时统计
    hour_stats = {}
    for hour in range(24):
        hour_stats[hour] = 0

    for task in tasks:
        hour = task.start.hour
        hour_stats[hour] += task.duration

    # 转换为列表格式
    time_distribution = [{"hour": hour, "duration": duration} for hour, duration in hour_stats.items()]

    return time_distribution

# 获取用户信息，包括注册日期
@router.get("/user-info")
def get_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 返回用户信息，包括注册日期和昵称
    # 由于User模型中没有nickname字段，我们使用username作为昵称
    return {
        "id": current_user.id,
        "username": current_user.username,
        "nickname": current_user.username,  # 使用username作为nickname
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

# 获取用户任务统计数据（专门为海报功能设计）
@router.get("/user-stats")
def get_user_task_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 查询用户的所有任务
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id
    ).all()

    # 计算总任务数和已完成任务数
    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.completed)

    # 获取今天的日期
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # 计算今日任务数和已完成任务数
    daily_tasks = 0
    daily_completed_tasks = 0

    # 查询今日的计划
    plans = db.query(Plan).filter(
        Plan.user_id == current_user.id,
        Plan.date >= today_start,
        Plan.date <= today_end
    ).all()

    daily_tasks = len(plans)
    daily_completed_tasks = sum(1 for plan in plans if plan.completed)

    # 计算连续学习天数（简化版）
    # 获取所有完成的任务日期
    completed_dates = set()
    for task in tasks:
        if task.completed and task.start:
            date_str = task.start.strftime("%Y-%m-%d")
            completed_dates.add(date_str)

    # 按日期排序
    sorted_dates = sorted(completed_dates)

    # 计算最长连续天数
    streak = 0
    current_streak = 0

    if sorted_dates:
        # 从最近的日期开始计算
        today_str = today.strftime("%Y-%m-%d")

        # 如果今天有完成任务，从今天开始计算
        if today_str in sorted_dates:
            current_date = datetime.now()
            current_streak = 1

            # 向前检查连续天数
            for i in range(1, 366):  # 最多检查一年
                prev_date = (current_date - timedelta(days=i)).strftime("%Y-%m-%d")
                if prev_date in sorted_dates:
                    current_streak += 1
                else:
                    break

        streak = current_streak

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_rate": round(completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
        "streak": streak,
        "daily_tasks": daily_tasks,
        "daily_completed_tasks": daily_completed_tasks,
        "daily_completion_rate": round(daily_completed_tasks / daily_tasks * 100) if daily_tasks > 0 else 0
    }
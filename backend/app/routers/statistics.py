# backend/app/routers/statistics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct
from datetime import datetime, date, timedelta
from app.models.task import Task
from app.models.user import User
from app.auth import get_current_active_user
from app.database import get_db
import pytz
from app.config import TIMEZONE
from typing import List, Dict, Any

router = APIRouter()

# 获取用户基本统计数据（根路径）
@router.get("/", response_model=None)
def get_basic_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
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

        # 转换为小时
        total_hours = round(total_minutes / 60, 1)

        return {
            "daily_duration": daily_duration,
            "total_hours": total_hours,
            "total_minutes": total_minutes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get basic statistics: {str(e)}")

# 获取用户每日统计数据
@router.get("/daily", response_model=None)
def get_daily_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
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

        # 如果没有数据，提供一个默认的空数组
        if not hourly_data:
            current_hour = now.hour
            hourly_data = [{"time": f"{current_hour:02d}:00", "duration": 0}]

        return {
            "duration": total_duration,
            "hourly": hourly_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get daily statistics: {str(e)}")

# 获取用户每周统计数据
@router.get("/weekly", response_model=None)
def get_weekly_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
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

        # 如果没有数据，提供默认值
        if not daily_data:
            # 获取今天是星期几
            today_weekday = today.weekday()
            day_name = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][today_weekday]
            daily_data = [{
                "date": today.isoformat(),
                "day": day_name,
                "duration": 0
            }]

        return {
            "total_duration": total_duration,
            "daily": daily_data,
            "week_start": start_of_week.isoformat(),
            "week_end": end_of_week.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weekly statistics: {str(e)}")

# 获取用户每月统计数据
@router.get("/monthly", response_model=None)
def get_monthly_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 获取本月的日期范围（中国时区）
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()

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

        # 如果没有数据，提供默认值
        if not daily_data:
            day = today.day
            daily_data = [{
                "date": today.isoformat(),
                "day": f"{day}日",
                "duration": 0
            }]

        return {
            "total_duration": total_duration,
            "daily": daily_data,
            "month_start": first_day.isoformat(),
            "month_end": last_day.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get monthly statistics: {str(e)}")

# 获取用户总体统计数据
@router.get("/total", response_model=None)
def get_total_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 查询所有任务总时长
        total_minutes = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id
        ).scalar() or 0

        # 转换为小时
        total_hours = round(total_minutes / 60, 1)

        # 查询任务总数
        total_tasks = db.query(func.count(Task.id)).filter(
            Task.user_id == current_user.id
        ).scalar() or 0

        # 查询完成的任务数
        completed_tasks = db.query(func.count(Task.id)).filter(
            Task.user_id == current_user.id,
            Task.completed == True
        ).scalar() or 0

        # 计算完成率
        completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)

        # 获取今天的日期范围（中国时区）
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # 查询今日任务总时长
        daily_minutes = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= today_start,
            Task.start <= today_end
        ).scalar() or 0

        # 计算本周的开始日期（周一）和结束日期（周日）
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        week_start = datetime.combine(start_of_week, datetime.min.time())
        week_end = datetime.combine(end_of_week, datetime.max.time())

        # 查询本周任务总时长
        weekly_minutes = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= week_start,
            Task.start <= week_end
        ).scalar() or 0

        # 计算本月的开始日期和结束日期
        year = now.year
        month = now.month
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)
        month_start = datetime.combine(first_day, datetime.min.time())
        month_end = datetime.combine(last_day, datetime.max.time())

        # 查询本月任务总时长
        monthly_minutes = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= month_start,
            Task.start <= month_end
        ).scalar() or 0

        return {
            "totalHours": total_hours,
            "totalMinutes": total_minutes,
            "dailyMinutes": daily_minutes,
            "weeklyMinutes": weekly_minutes,
            "monthlyMinutes": monthly_minutes,
            "tasks": total_tasks,
            "completed": completed_tasks,
            "completion_rate": completion_rate
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get total statistics: {str(e)}")

# 获取用户热力图数据
@router.get("/heatmap", response_model=None)
def get_heatmap_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 获取过去一年的数据（中国时区）
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()
        one_year_ago = today - timedelta(days=365)

        # 查询每天的任务时长
        daily_stats = db.query(
            func.date(Task.start).label('date'),
            func.sum(Task.duration).label('duration'),
            func.count(Task.id).label('count')
        ).filter(
            Task.user_id == current_user.id,
            Task.start >= datetime.combine(one_year_ago, datetime.min.time()),
            Task.start <= datetime.combine(today, datetime.max.time())
        ).group_by(func.date(Task.start)).all()

        # 转换为字典列表
        heatmap_data = []
        for stat in daily_stats:
            heatmap_data.append({
                "date": stat.date.isoformat(),
                "count": stat.count,
                "duration": stat.duration
            })

        return heatmap_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get heatmap data: {str(e)}")

# 获取用户时间分布数据
@router.get("/time-distribution", response_model=None)
def get_time_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
        # 查询每小时的任务时长
        hourly_stats = db.query(
            func.extract('hour', Task.start).label('hour'),
            func.sum(Task.duration).label('duration'),
            func.count(Task.id).label('count')
        ).filter(
            Task.user_id == current_user.id
        ).group_by(func.extract('hour', Task.start)).all()

        # 转换为字典列表
        time_distribution = []
        for stat in hourly_stats:
            time_distribution.append({
                "hour": int(stat.hour),
                "count": stat.count,
                "duration": stat.duration
            })

        return time_distribution
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get time distribution data: {str(e)}")

# 获取用户统计数据
@router.get("/user", response_model=None)
def get_user_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    try:
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

        # 转换为小时
        total_hours = round(total_minutes / 60, 1)

        # 查询任务总数
        total_tasks = db.query(func.count(Task.id)).filter(
            Task.user_id == current_user.id
        ).scalar() or 0

        # 查询完成的任务数
        completed_tasks = db.query(func.count(Task.id)).filter(
            Task.user_id == current_user.id,
            Task.completed == True
        ).scalar() or 0

        return {
            "daily_duration": daily_duration,
            "total_hours": total_hours,
            "total_minutes": total_minutes,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user statistics: {str(e)}")

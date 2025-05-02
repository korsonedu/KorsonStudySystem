# backend/app/modules/study/routers/statistics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.modules.study.models.task import Task
from app.modules.common.models.user import User
from app.modules.common.routers.auth import get_current_active_user
from app.modules.study.schemas.statistics import (
    Statistics, DailyStatsResponse, WeeklyStatsResponse,
    MonthlyStatsResponse, TotalStatsResponse, HeatmapResponse,
    TimeDistributionResponse
)
from datetime import datetime, timedelta
import pytz
from app.config import TIMEZONE

router = APIRouter(prefix="/statistics", tags=["statistics"])

@router.get("/", response_model=Statistics)
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的统计数据"""
    try:
        # 获取中国时区
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)

        # 计算时间范围
        today = now.date()
        yesterday = today - timedelta(days=1)
        this_week_start = today - timedelta(days=today.weekday())
        this_month_start = today.replace(day=1)

        # 转换为datetime对象
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        yesterday_start = datetime.combine(yesterday, datetime.min.time())
        yesterday_end = datetime.combine(yesterday, datetime.max.time())
        this_week_start = datetime.combine(this_week_start, datetime.min.time())
        this_month_start = datetime.combine(this_month_start, datetime.min.time())

        # 查询今日学习时间
        today_duration = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= today_start,
            Task.end <= today_end
        ).scalar() or 0

        # 查询昨日学习时间
        yesterday_duration = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= yesterday_start,
            Task.end <= yesterday_end
        ).scalar() or 0

        # 查询本周学习时间
        this_week_duration = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= this_week_start
        ).scalar() or 0

        # 查询本月学习时间
        this_month_duration = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= this_month_start
        ).scalar() or 0

        # 查询总学习时间
        total_duration = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id
        ).scalar() or 0

        # 查询每日学习时间（最近30天）
        thirty_days_ago = today - timedelta(days=30)
        daily_stats = []

        for i in range(30):
            day = thirty_days_ago + timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())

            day_duration = db.query(func.sum(Task.duration)).filter(
                Task.user_id == current_user.id,
                Task.start >= day_start,
                Task.end <= day_end
            ).scalar() or 0

            daily_stats.append({
                "date": day.strftime("%Y-%m-%d"),
                "duration": day_duration
            })

        # 查询每小时学习时间分布
        hourly_stats = []

        for hour in range(24):
            hour_duration = db.query(func.sum(Task.duration)).filter(
                Task.user_id == current_user.id,
                extract('hour', Task.start) == hour
            ).scalar() or 0

            hourly_stats.append({
                "hour": hour,
                "duration": hour_duration
            })

        return {
            "today": today_duration,
            "yesterday": yesterday_duration,
            "this_week": this_week_duration,
            "this_month": this_month_duration,
            "total": total_duration,
            "daily": daily_stats,
            "hourly": hourly_stats
        }
    except Exception as e:
        print(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")

@router.get("/daily", response_model=DailyStatsResponse)
def get_daily_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的每日统计数据"""
    try:
        # 获取中国时区
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()

        # 获取今日每小时学习时间
        hourly_stats = []
        for hour in range(24):
            hour_duration = db.query(func.sum(Task.duration)).filter(
                Task.user_id == current_user.id,
                extract('hour', Task.start) == hour,
                Task.start >= datetime.combine(today, datetime.min.time()),
                Task.end <= datetime.combine(today, datetime.max.time())
            ).scalar() or 0

            hourly_stats.append({
                "hour": hour,
                "duration": hour_duration
            })

        # 计算今日总学习时间
        today_duration = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= datetime.combine(today, datetime.min.time()),
            Task.end <= datetime.combine(today, datetime.max.time())
        ).scalar() or 0

        return {
            "hourly": hourly_stats,
            "total": today_duration
        }
    except Exception as e:
        print(f"Error getting daily stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting daily stats: {str(e)}")

@router.get("/weekly", response_model=WeeklyStatsResponse)
def get_weekly_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的每周统计数据"""
    try:
        # 获取中国时区
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()

        # 计算本周开始日期
        week_start = today - timedelta(days=today.weekday())

        # 获取本周每日学习时间
        daily_stats = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())

            day_duration = db.query(func.sum(Task.duration)).filter(
                Task.user_id == current_user.id,
                Task.start >= day_start,
                Task.end <= day_end
            ).scalar() or 0

            daily_stats.append({
                "day": day.strftime("%Y-%m-%d"),
                "duration": day_duration
            })

        # 计算本周总学习时间
        week_duration = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= datetime.combine(week_start, datetime.min.time())
        ).scalar() or 0

        return {
            "daily": daily_stats,
            "total": week_duration
        }
    except Exception as e:
        print(f"Error getting weekly stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting weekly stats: {str(e)}")

@router.get("/monthly", response_model=MonthlyStatsResponse)
def get_monthly_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的每月统计数据"""
    try:
        # 获取中国时区
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()

        # 计算本月开始日期
        month_start = today.replace(day=1)

        # 计算本月天数
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        days_in_month = (next_month - month_start).days

        # 获取本月每日学习时间
        daily_stats = []
        for i in range(days_in_month):
            day = month_start + timedelta(days=i)
            if day > today:
                break

            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())

            day_duration = db.query(func.sum(Task.duration)).filter(
                Task.user_id == current_user.id,
                Task.start >= day_start,
                Task.end <= day_end
            ).scalar() or 0

            daily_stats.append({
                "day": day.strftime("%Y-%m-%d"),
                "duration": day_duration
            })

        # 计算本月总学习时间
        month_duration = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= datetime.combine(month_start, datetime.min.time())
        ).scalar() or 0

        return {
            "daily": daily_stats,
            "total": month_duration
        }
    except Exception as e:
        print(f"Error getting monthly stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting monthly stats: {str(e)}")

@router.get("/total", response_model=TotalStatsResponse)
def get_total_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的总计统计数据"""
    try:
        # 获取中国时区
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)
        today = now.date()

        # 计算时间范围
        yesterday = today - timedelta(days=1)
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        # 查询今日学习时间
        daily_minutes = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= datetime.combine(today, datetime.min.time()),
            Task.end <= datetime.combine(today, datetime.max.time())
        ).scalar() or 0

        # 查询本周学习时间
        weekly_minutes = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= datetime.combine(week_start, datetime.min.time())
        ).scalar() or 0

        # 查询本月学习时间
        monthly_minutes = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id,
            Task.start >= datetime.combine(month_start, datetime.min.time())
        ).scalar() or 0

        # 查询总学习时间
        total_minutes = db.query(func.sum(Task.duration)).filter(
            Task.user_id == current_user.id
        ).scalar() or 0

        # 转换为小时
        total_hours = round(total_minutes / 60, 1)

        return {
            "dailyMinutes": daily_minutes,
            "weeklyMinutes": weekly_minutes,
            "monthlyMinutes": monthly_minutes,
            "totalHours": total_hours
        }
    except Exception as e:
        print(f"Error getting total stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting total stats: {str(e)}")

@router.get("/time-distribution", response_model=TimeDistributionResponse)
def get_time_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的时间分布数据"""
    try:
        # 获取中国时区
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)

        # 查询每小时学习时间分布
        hourly_stats = []

        for hour in range(24):
            hour_duration = db.query(func.sum(Task.duration)).filter(
                Task.user_id == current_user.id,
                extract('hour', Task.start) == hour
            ).scalar() or 0

            hourly_stats.append({
                "hour": hour,
                "duration": hour_duration
            })

        return hourly_stats
    except Exception as e:
        print(f"Error getting time distribution data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting time distribution data: {str(e)}")

@router.get("/heatmap", response_model=HeatmapResponse)
def get_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的热力图数据"""
    try:
        # 获取中国时区
        china_tz = pytz.timezone(TIMEZONE)
        now = datetime.now(china_tz)

        # 计算时间范围（从注册日期到今天）
        today = now.date()
        registration_date = current_user.created_at.date()

        # 如果注册日期超过一年，则只显示最近一年的数据
        one_year_ago = today - timedelta(days=365)
        if registration_date < one_year_ago:
            registration_date = one_year_ago

        # 查询每日学习时间
        heatmap_data = []

        current_date = registration_date
        while current_date <= today:
            day_start = datetime.combine(current_date, datetime.min.time())
            day_end = datetime.combine(current_date, datetime.max.time())

            day_duration = db.query(func.sum(Task.duration)).filter(
                Task.user_id == current_user.id,
                Task.start >= day_start,
                Task.end <= day_end
            ).scalar() or 0

            heatmap_data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "count": day_duration // 60  # 转换为小时
            })

            current_date += timedelta(days=1)

        return heatmap_data
    except Exception as e:
        print(f"Error getting heatmap data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting heatmap data: {str(e)}")

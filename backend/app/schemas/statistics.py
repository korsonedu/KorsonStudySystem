from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, date

class TimeDistribution(BaseModel):
    hour: int
    count: int
    duration: int

class DailyStatistics(BaseModel):
    date: date
    total_tasks: int
    completed_tasks: int
    total_duration: int
    time_distribution: List[TimeDistribution]

class WeeklyStatistics(BaseModel):
    week_start: date
    week_end: date
    total_tasks: int
    completed_tasks: int
    total_duration: int
    daily_stats: List[Dict[str, Any]]

class MonthlyStatistics(BaseModel):
    month: int
    year: int
    total_tasks: int
    completed_tasks: int
    total_duration: int
    weekly_stats: List[Dict[str, Any]]

class HeatmapData(BaseModel):
    date: date
    count: int
    duration: int

class UserStatistics(BaseModel):
    total_tasks: int
    completed_tasks: int
    total_duration: int
    streak_days: int
    average_daily_duration: float
    most_productive_day: Optional[str] = None
    most_productive_hour: Optional[int] = None

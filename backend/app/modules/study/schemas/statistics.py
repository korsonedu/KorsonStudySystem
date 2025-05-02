# backend/app/modules/study/schemas/statistics.py
from pydantic import BaseModel, RootModel, Field
from typing import List, Optional

# 基础统计数据模型
class DailyStats(BaseModel):
    date: str = Field(..., description="日期，格式为YYYY-MM-DD")
    duration: int = Field(..., description="学习时长（分钟）")

class HourlyStats(BaseModel):
    hour: int = Field(..., description="小时，0-23")
    duration: int = Field(..., description="学习时长（分钟）")

class HeatmapData(BaseModel):
    date: str = Field(..., description="日期，格式为YYYY-MM-DD")
    count: int = Field(..., description="学习时长（小时）")

# 每日统计响应模型
class DailyStatsResponse(BaseModel):
    hourly: List[HourlyStats] = Field(..., description="每小时学习时长")
    total: int = Field(..., description="今日总学习时长（分钟）")
    content: Optional[List[dict]] = Field(None, description="学习内容分布")

# 每周统计响应模型
class WeeklyStatsResponse(BaseModel):
    daily: List[DailyStats] = Field(..., description="每日学习时长")
    total: int = Field(..., description="本周总学习时长（分钟）")
    content: Optional[List[dict]] = Field(None, description="学习内容分布")

# 每月统计响应模型
class MonthlyStatsResponse(BaseModel):
    daily: List[DailyStats] = Field(..., description="每日学习时长")
    total: int = Field(..., description="本月总学习时长（分钟）")
    content: Optional[List[dict]] = Field(None, description="学习内容分布")

# 总计统计响应模型
class TotalStatsResponse(BaseModel):
    dailyMinutes: int = Field(..., description="今日学习时长（分钟）")
    weeklyMinutes: int = Field(..., description="本周学习时长（分钟）")
    monthlyMinutes: int = Field(..., description="本月学习时长（分钟）")
    totalHours: float = Field(..., description="累计学习时长（小时）")

# 时间分布响应模型
class TimeDistributionResponse(RootModel):
    root: List[HourlyStats]

# 热力图响应模型
class HeatmapResponse(RootModel):
    root: List[HeatmapData]

# 综合统计响应模型（用于主统计接口）
class Statistics(BaseModel):
    today: int = Field(..., description="今日学习时长（分钟）")
    yesterday: int = Field(..., description="昨日学习时长（分钟）")
    this_week: int = Field(..., description="本周学习时长（分钟）")
    this_month: int = Field(..., description="本月学习时长（分钟）")
    total: int = Field(..., description="累计学习时长（分钟）")
    daily: List[DailyStats] = Field(..., description="每日学习时长（最近30天）")
    hourly: List[HourlyStats] = Field(..., description="每小时学习时长分布")

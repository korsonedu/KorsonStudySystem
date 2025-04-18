# backend/app/schemas/statistic.py
from pydantic import BaseModel
from typing import Optional

class StatisticResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    total_duration: int
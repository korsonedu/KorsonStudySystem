# backend/app/modules/study/schemas/task.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    name: str
    duration: int
    completed: bool = False

class TaskCreate(TaskBase):
    start: datetime
    end: datetime

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    duration: Optional[int] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    completed: Optional[bool] = None

class TaskInDB(TaskBase):
    id: int
    start: datetime
    end: datetime
    user_id: int

    class Config:
        from_attributes = True

class TaskResponse(TaskInDB):
    pass

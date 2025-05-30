from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TaskBase(BaseModel):
    name: str
    duration: int
    start: Optional[datetime] = None
    end: Optional[datetime] = None  # 允许为空，但在业务逻辑中处理
    completed: Optional[bool] = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    duration: Optional[int] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None  # 允许为空，但在业务逻辑中处理
    completed: Optional[bool] = None

class TaskResponse(TaskBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

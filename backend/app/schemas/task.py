from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TaskBase(BaseModel):
    name: str
    duration: int
    completed: Optional[bool] = False
    start: Optional[datetime] = None
    end: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    duration: Optional[int] = None
    completed: Optional[bool] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

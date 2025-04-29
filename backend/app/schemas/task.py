from datetime import datetime
from pydantic import BaseModel, field_serializer
from typing import Optional

class TaskBase(BaseModel):
    name: str
    duration: int
    start: str
    end: str
    completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    name: Optional[str] = None
    duration: Optional[int] = None
    start: Optional[str] = None
    end: Optional[str] = None
    completed: Optional[bool] = None

class TaskResponse(TaskBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class TaskBase(BaseModel):
    name: str
    duration: int
    start: datetime
    end: datetime

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    name: Optional[str] = None
    duration: Optional[int] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None

class TaskInDB(TaskBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
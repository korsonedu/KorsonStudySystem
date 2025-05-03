from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class PlanBase(BaseModel):
    text: str
    completed: Optional[bool] = False
    created_at: Optional[datetime] = None
    started: Optional[bool] = False
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    text: Optional[str] = None
    completed: Optional[bool] = None
    started: Optional[bool] = None

class PlanResponse(PlanBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# backend/app/modules/study/schemas/plan.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PlanBase(BaseModel):
    text: str
    completed: bool = False
    started: bool = False

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    text: Optional[str] = None
    completed: Optional[bool] = None
    started: Optional[bool] = None

class PlanInDB(PlanBase):
    id: int
    user_id: int
    created_at: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class PlanResponse(PlanInDB):
    pass

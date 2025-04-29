# backend/app/schemas/plan.py
from pydantic import BaseModel
from typing import Optional

class PlanBase(BaseModel):
    text: str

class PlanCreate(PlanBase):
    pass

class PlanUpdate(PlanBase):
    text: Optional[str] = None
    completed: Optional[bool] = None
    started: Optional[bool] = None

class PlanResponse(PlanBase):
    id: int
    user_id: int
    completed: bool
    started: bool
    created_at: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None

    class Config:
        from_attributes = True
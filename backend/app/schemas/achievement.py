from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class AchievementBase(BaseModel):
    type: str
    level: int
    unlocked_at: Optional[datetime] = None

class AchievementCreate(AchievementBase):
    pass

class AchievementUpdate(BaseModel):
    type: Optional[str] = None
    level: Optional[int] = None

class AchievementResponse(AchievementBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# backend/app/schemas/achievement.py
from pydantic import BaseModel
from typing import Optional

class AchievementBase(BaseModel):
    type: str
    level: int

class AchievementCreate(AchievementBase):
    pass

class AchievementUpdate(AchievementBase):
    type: Optional[str] = None
    level: Optional[int] = None

class AchievementInDB(AchievementBase):
    id: int
    user_id: int
    unlocked_at: str

    class Config:
        orm_mode = True
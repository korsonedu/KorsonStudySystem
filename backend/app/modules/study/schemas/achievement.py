# backend/app/modules/study/schemas/achievement.py
from pydantic import BaseModel
from datetime import datetime

class AchievementBase(BaseModel):
    type: str
    level: int

class AchievementCreate(AchievementBase):
    pass

class AchievementInDB(AchievementBase):
    id: int
    user_id: int
    unlocked_at: datetime

    class Config:
        from_attributes = True

class AchievementResponse(AchievementInDB):
    pass

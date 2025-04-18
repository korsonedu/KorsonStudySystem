# backend/app/routers/achievements.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.achievement import Achievement
from app.models.user import User
from app.schemas.achievement import AchievementCreate, AchievementUpdate
from app.auth import get_current_superuser
from app.database import get_db  # 确保正确导入 get_db

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 获取所有成就（仅管理员）
@router.get("/", response_model=list[AchievementCreate])
def read_achievements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(get_current_superuser)):
    achievements = db.query(Achievement).offset(skip).limit(limit).all()
    return achievements

# 创建新成就（仅管理员）
@router.post("/", response_model=AchievementCreate)
def create_achievement(achievement: AchievementCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_superuser)):
    db_achievement = Achievement(**achievement.dict())
    db.add(db_achievement)
    db.commit()
    db.refresh(db_achievement)
    return db_achievement

# 更新成就（仅管理员）
@router.put("/{achievement_id}", response_model=AchievementCreate)
def update_achievement(achievement_id: int, achievement: AchievementUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_superuser)):
    db_achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not db_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    db_achievement.type = achievement.type
    db_achievement.level = achievement.level
    db.commit()
    db.refresh(db_achievement)
    return db_achievement

# 删除成就（仅管理员）
@router.delete("/{achievement_id}")
def delete_achievement(achievement_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_superuser)):
    db_achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not db_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    db.delete(db_achievement)
    db.commit()
    return {"message": "Achievement deleted successfully"}
# backend/app/modules/study/routers/achievements.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.modules.study.models.achievement import Achievement
from app.modules.common.models.user import User
from app.modules.common.routers.auth import get_current_active_user
from datetime import datetime

router = APIRouter(prefix="/achievements", tags=["achievements"])

@router.post("/")
def create_achievement(
    achievement_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建新成就"""
    try:
        # 创建成就
        db_achievement = Achievement(
            type=achievement_data["type"],
            level=achievement_data["level"],
            user_id=current_user.id
        )
        
        db.add(db_achievement)
        db.commit()
        db.refresh(db_achievement)
        
        return {
            "id": db_achievement.id,
            "type": db_achievement.type,
            "level": db_achievement.level,
            "unlocked_at": db_achievement.unlocked_at,
            "user_id": db_achievement.user_id
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating achievement: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating achievement: {str(e)}")

@router.get("/")
def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的所有成就"""
    achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).all()
    return achievements

@router.get("/{achievement_id}")
def get_achievement(
    achievement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取指定ID的成就"""
    achievement = db.query(Achievement).filter(Achievement.id == achievement_id, Achievement.user_id == current_user.id).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return achievement

@router.delete("/{achievement_id}")
def delete_achievement(
    achievement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除指定ID的成就"""
    db_achievement = db.query(Achievement).filter(Achievement.id == achievement_id, Achievement.user_id == current_user.id).first()
    if not db_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    try:
        db.delete(db_achievement)
        db.commit()
        return {"message": "Achievement deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting achievement: {str(e)}")

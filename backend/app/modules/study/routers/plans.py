# backend/app/modules/study/routers/plans.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.modules.study.models.plan import Plan
from app.modules.common.models.user import User
from app.modules.common.routers.auth import get_current_active_user
from datetime import datetime
import pytz
from app.config import TIMEZONE

router = APIRouter(prefix="/plans", tags=["plans"])

@router.post("/")
def create_plan(
    plan_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建新计划"""
    try:
        # 创建计划
        db_plan = Plan(
            text=plan_data["text"],
            completed=plan_data.get("completed", False),
            started=plan_data.get("started", False),
            user_id=current_user.id
        )
        
        # 如果有创建时间，则设置
        if "createdAt" in plan_data and plan_data["createdAt"]:
            try:
                # 尝试解析带有时区信息的日期字符串
                from dateutil import parser
                parsed_date = parser.parse(plan_data["createdAt"])
                # 转换为无时区的datetime对象
                db_plan.created_at = parsed_date.replace(tzinfo=None)
            except Exception as e:
                print(f"Error parsing createdAt: {str(e)}")
                # 使用当前时间
                china_tz = pytz.timezone(TIMEZONE)
                db_plan.created_at = datetime.now(china_tz).replace(tzinfo=None)
        
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        
        return {
            "id": db_plan.id,
            "text": db_plan.text,
            "completed": db_plan.completed,
            "started": db_plan.started,
            "created_at": db_plan.created_at,
            "user_id": db_plan.user_id
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating plan: {str(e)}")

@router.get("/")
def get_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的所有计划"""
    plans = db.query(Plan).filter(Plan.user_id == current_user.id).all()
    return plans

@router.get("/{plan_id}")
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取指定ID的计划"""
    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@router.put("/{plan_id}")
def update_plan(
    plan_id: int,
    plan_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新指定ID的计划"""
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    try:
        # 更新字段
        if "text" in plan_data:
            db_plan.text = plan_data["text"]
        if "completed" in plan_data:
            db_plan.completed = plan_data["completed"]
        if "started" in plan_data:
            db_plan.started = plan_data["started"]
        
        # 如果计划开始，记录开始时间
        if "started" in plan_data and plan_data["started"] and not db_plan.start_time:
            db_plan.start_time = datetime.now()
        
        # 如果计划完成，记录结束时间
        if "completed" in plan_data and plan_data["completed"] and not db_plan.end_time:
            db_plan.end_time = datetime.now()
        
        db.commit()
        db.refresh(db_plan)
        
        return db_plan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating plan: {str(e)}")

@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除指定ID的计划"""
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    try:
        db.delete(db_plan)
        db.commit()
        return {"message": "Plan deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting plan: {str(e)}")

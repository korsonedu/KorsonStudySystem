# backend/app/routers/plans.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.plan import Plan
from app.models.user import User
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse
from app.auth import get_current_active_user
from datetime import datetime, timezone
from app.database import get_db
from typing import List

router = APIRouter()

# 获取用户的所有计划
@router.get("/", response_model=List[PlanResponse])
def read_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    plans = db.query(Plan).filter(Plan.user_id == current_user.id).offset(skip).limit(limit).all()

    # 转换日期时间为字符串
    for plan in plans:
        if plan.created_at:
            plan.created_at = plan.created_at.isoformat()
        if plan.start_time:
            plan.start_time = plan.start_time.isoformat()
        if plan.end_time:
            plan.end_time = plan.end_time.isoformat()

    return plans

# 创建新计划
@router.post("/", response_model=PlanResponse)
def create_plan(plan: PlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = Plan(**plan.model_dump(), user_id=current_user.id)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    # 转换日期时间为字符串
    if db_plan.created_at:
        db_plan.created_at = db_plan.created_at.isoformat()
    if db_plan.start_time:
        db_plan.start_time = db_plan.start_time.isoformat()
    if db_plan.end_time:
        db_plan.end_time = db_plan.end_time.isoformat()

    return db_plan

# 更新计划
@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: int, plan: PlanUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="计划未找到")
    
    plan_data = plan.model_dump(exclude_unset=True)
    for key, value in plan_data.items():
        setattr(db_plan, key, value)
        
    db.commit()
    db.refresh(db_plan)

    # 转换日期时间为字符串
    if db_plan.created_at:
        db_plan.created_at = db_plan.created_at.isoformat()
    if db_plan.start_time:
        db_plan.start_time = db_plan.start_time.isoformat()
    if db_plan.end_time:
        db_plan.end_time = db_plan.end_time.isoformat()

    return db_plan

# 开始计划
@router.post("/{plan_id}/start", response_model=PlanResponse)
def start_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="计划未找到")
    if db_plan.started:
        raise HTTPException(status_code=400, detail="计划已经开始")
        
    db_plan.started = True
    db_plan.start_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_plan)

    # 转换日期时间为字符串
    if db_plan.created_at:
        db_plan.created_at = db_plan.created_at.isoformat()
    if db_plan.start_time:
        db_plan.start_time = db_plan.start_time.isoformat()
    if db_plan.end_time:
        db_plan.end_time = db_plan.end_time.isoformat()

    return db_plan

# 完成计划
@router.post("/{plan_id}/complete", response_model=PlanResponse)
def complete_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="计划未找到")
    if not db_plan.started:
        raise HTTPException(status_code=400, detail="计划尚未开始")
        
    db_plan.completed = True
    db_plan.end_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_plan)
    
    # 转换日期时间为字符串
    if db_plan.created_at:
        db_plan.created_at = db_plan.created_at.isoformat()
    if db_plan.start_time:
        db_plan.start_time = db_plan.start_time.isoformat()
    if db_plan.end_time:
        db_plan.end_time = db_plan.end_time.isoformat()
        
    return db_plan

# 删除计划
@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="计划未找到")

    db.delete(db_plan)
    db.commit()

    return {"message": "计划删除成功"}
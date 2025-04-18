# backend/app/routers/plans.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.plan import Plan
from app.models.user import User
from app.schemas.plan import PlanCreate, PlanUpdate
from app.auth import get_current_active_user
from datetime import datetime
from app.database import get_db  # 确保正确导入 get_db

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 获取用户的所有计划
@router.get("/", response_model=list[PlanCreate])
def read_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    plans = db.query(Plan).filter(Plan.user_id == current_user.id).offset(skip).limit(limit).all()
    return plans

# 创建新计划
@router.post("/", response_model=PlanCreate)
def create_plan(plan: PlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = Plan(**plan.dict(), user_id=current_user.id)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

# 更新计划
@router.put("/{plan_id}", response_model=PlanCreate)
def update_plan(plan_id: int, plan: PlanUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db_plan.text = plan.text
    db_plan.completed = plan.completed
    db.commit()
    db.refresh(db_plan)
    return db_plan

# 开始计划
@router.post("/{plan_id}/start", response_model=PlanCreate)
def start_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if db_plan.started:
        raise HTTPException(status_code=400, detail="Plan already started")
    db_plan.started = True
    db_plan.start_time = datetime.utcnow()
    db.commit()
    db.refresh(db_plan)
    return db_plan

# 完成计划
@router.post("/{plan_id}/complete", response_model=PlanCreate)
def complete_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.user_id == current_user.id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if not db_plan.started:
        raise HTTPException(status_code=400, detail="Plan not started")
    db_plan.completed = True
    db_plan.end_time = datetime.utcnow()
    db.commit()
    db.refresh(db_plan)
    return db_plan
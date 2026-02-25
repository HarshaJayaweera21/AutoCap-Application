from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional

from database import get_db
from models.feedback import Feedback
from schemas.feedback import FeedbackOut, FeedbackAdminUpdate, FeedbackStats
from auth import get_current_admin

router = APIRouter(prefix="/admin/feedback", tags=["admin-feedback"])

@router.get("/", response_model=List[FeedbackOut])
async def list_all_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    # admin_id: int = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(Feedback).order_by(desc(Feedback.created_at)).offset(skip).limit(limit)
    if status:
        query = query.filter(Feedback.status == status)
        
    result = await db.execute(query)
    feedbacks = result.scalars().all()
    return feedbacks

@router.patch("/{feedback_id}", response_model=FeedbackOut)
async def update_feedback_status(
    feedback_id: int,
    update_data: FeedbackAdminUpdate,
    # admin_id: int = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Feedback).filter(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    if update_data.status is not None:
        feedback.status = update_data.status
        
    await db.commit()
    await db.refresh(feedback)
    return feedback

@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: int,
    # admin_id: int = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Feedback).filter(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    await db.delete(feedback)
    await db.commit()
    return {"message": "Feedback deleted successfully"}

@router.get("/stats/dashboard", response_model=FeedbackStats)
async def get_feedback_stats(
    # admin_id: int = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Total count
    total_res = await db.execute(select(func.count(Feedback.id)))
    total_count = total_res.scalar() or 0
    
    # Average rating
    avg_res = await db.execute(select(func.avg(Feedback.rating)).filter(Feedback.rating.isnot(None)))
    average_rating = avg_res.scalar() or 0.0
    
    # Status breakdown
    status_res = await db.execute(select(Feedback.status, func.count(Feedback.id)).group_by(Feedback.status))
    status_breakdown = {status: count for status, count in status_res.all() if status is not None}
    
    # Type distribution
    type_res = await db.execute(select(Feedback.type, func.count(Feedback.id)).group_by(Feedback.type))
    type_distribution = {typ: count for typ, count in type_res.all() if typ is not None}
    
    return FeedbackStats(
        total_count=total_count,
        average_rating=float(average_rating),
        status_breakdown=status_breakdown,
        type_distribution=type_distribution
    )

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_

from database import get_db
from models.feedback import Feedback
from schemas.feedback import FeedbackCreate, FeedbackOut
from auth import get_current_user_optional
import logging

router = APIRouter(prefix="/feedback", tags=["feedback"])
logger = logging.getLogger(__name__)

_RATE_LIMITS = {}

def rate_limit(request: Request, limit: int = 10, window: int = 60):
    client_ip = request.client.host
    now = datetime.now()
    if client_ip not in _RATE_LIMITS:
        _RATE_LIMITS[client_ip] = []
    
    _RATE_LIMITS[client_ip] = [req_time for req_time in _RATE_LIMITS[client_ip] if (now - req_time).total_seconds() < window]
    
    if len(_RATE_LIMITS[client_ip]) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests")
    
    _RATE_LIMITS[client_ip].append(now)

@router.post("/", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    request: Request,
    feedback_in: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[int] = Depends(get_current_user_optional)
):
    rate_limit(request, limit=5, window=3600)
    
    user_id = current_user if current_user else 0  # Assuming 0 or some mechanism for anon if allowed, but schema says NOT NULL
    if not current_user:
        # Schema requires user_id. Block anon if no user_id.
        raise HTTPException(status_code=401, detail="Must be logged in to submit feedback")

    # Basic sanitization
    subject_san = feedback_in.subject.strip().replace("<", "&lt;").replace(">", "&gt;") if feedback_in.subject else None
    msg_san = feedback_in.message.strip().replace("<", "&lt;").replace(">", "&gt;")

    db_feedback = Feedback(
        user_id=user_id,
        type=feedback_in.type,
        subject=subject_san,
        message=msg_san,
        rating=feedback_in.rating,
        screenshot_url=feedback_in.screenshot_url
    )
    db.add(db_feedback)
    await db.flush()
    await db.commit()
    await db.refresh(db_feedback)
    return db_feedback

@router.get("/", response_model=List[FeedbackOut])
async def list_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    feedback_status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[int] = Depends(get_current_user_optional)
):
    query = select(Feedback)

    if type:
        query = query.filter(Feedback.type == type)
    if feedback_status:
        query = query.filter(Feedback.status == feedback_status)
    if search:
        query = query.filter(or_(
            Feedback.subject.ilike(f"%{search}%"),
            Feedback.message.ilike(f"%{search}%")
        ))

    query = query.order_by(desc(Feedback.created_at))
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    feedbacks = result.scalars().all()
    
    return feedbacks

@router.get("/{feedback_id}", response_model=FeedbackOut)
async def get_feedback(
    feedback_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Optional[int] = Depends(get_current_user_optional)
):
    result = await db.execute(select(Feedback).filter(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    return feedback

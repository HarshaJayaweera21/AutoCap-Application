from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime

class FeedbackBase(BaseModel):
    type: Optional[Literal['Bug Report', 'Feature Request', 'General', 'Caption Quality']] = 'General'
    subject: Optional[str] = Field(None, max_length=120)
    message: str
    rating: Optional[int] = Field(None, ge=1, le=5)
    screenshot_url: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackUpdate(BaseModel):
    type: Optional[Literal['Bug Report', 'Feature Request', 'General', 'Caption Quality']] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    screenshot_url: Optional[str] = None

class FeedbackAdminUpdate(BaseModel):
    status: Optional[Literal['New', 'In Review', 'Resolved', "Won't Fix"]] = None

class FeedbackOut(FeedbackBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class FeedbackStats(BaseModel):
    total_count: int
    average_rating: float
    status_breakdown: dict
    type_distribution: dict

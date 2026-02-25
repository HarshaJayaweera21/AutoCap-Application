from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, BigInteger
from database import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    type = Column(String(50), default='General', nullable=True) 
    subject = Column(String(120), nullable=True)
    message = Column(Text, nullable=False)
    rating = Column(Integer, CheckConstraint('rating >= 1 AND rating <= 5'), nullable=True)
    status = Column(String(30), default='New', nullable=True, index=True) 
    screenshot_url = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)

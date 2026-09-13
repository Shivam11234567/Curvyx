import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    razorpay_order_id = Column(String(255), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(255), nullable=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(32), default="CREATED", nullable=False)
    raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    order = relationship("Order", back_populates="payment")

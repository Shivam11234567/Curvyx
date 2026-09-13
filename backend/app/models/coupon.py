import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_type = Column(String(20), default="PERCENTAGE", nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    minimum_order_value = Column(Numeric(10, 2), default=0.0, nullable=False)
    maximum_discount = Column(Numeric(10, 2), nullable=True)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0, nullable=False)
    start_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    order_number = Column(String(64), unique=True, index=True, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0.0, nullable=False)
    shipping_amount = Column(Numeric(10, 2), default=0.0, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String(32), default="PENDING", nullable=False)
    order_status = Column(String(32), default="PENDING", nullable=False)
    shipping_address_snapshot = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

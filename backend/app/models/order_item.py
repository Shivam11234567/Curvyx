import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_variant_id = Column(String(36), nullable=True)
    product_name_snapshot = Column(String(255), nullable=False)
    sku_snapshot = Column(String(100), nullable=False)
    size_snapshot = Column(String(50), nullable=False)
    color_snapshot = Column(String(50), nullable=False)
    image_url_snapshot = Column(String(1024), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    order = relationship("Order", back_populates="items")

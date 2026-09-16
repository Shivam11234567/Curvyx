from typing import Optional, List, Any, Dict
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class CheckoutRequest(BaseModel):
    shipping_address_id: str
    coupon_code: Optional[str] = None
    payment_method: Optional[str] = "RAZORPAY"

class OrderItemResponse(BaseModel):
    id: str
    product_variant_id: Optional[str] = None
    product_name_snapshot: str
    sku_snapshot: str
    size_snapshot: str
    color_snapshot: str
    image_url_snapshot: Optional[str] = None
    unit_price: Decimal
    quantity: int
    total_price: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: Optional[str] = None
    subtotal: Decimal
    discount: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    payment_status: str
    order_status: str
    payment_method: Optional[str] = "RAZORPAY"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    shipping_address_snapshot: Dict[str, Any]
    items_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderDetailResponse(OrderResponse):
    items: List[OrderItemResponse] = []

class UpdateOrderStatusRequest(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None

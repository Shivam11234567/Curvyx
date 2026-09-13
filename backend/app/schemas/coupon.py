from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    discount_type: str = "PERCENTAGE"
    discount_value: Decimal = Field(..., gt=0)
    minimum_order_value: Decimal = Field(Decimal("0.00"), ge=0)
    maximum_discount: Optional[Decimal] = None
    usage_limit: Optional[int] = None
    start_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    minimum_order_value: Optional[Decimal] = None
    maximum_discount: Optional[Decimal] = None
    usage_limit: Optional[int] = None
    start_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: str
    used_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ApplyCouponRequest(BaseModel):
    code: str

class ApplyCouponResponse(BaseModel):
    code: str
    discount_amount: Decimal
    discount_type: str
    discount_value: Decimal

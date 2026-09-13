from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

class AddToCartRequest(BaseModel):
    product_variant_id: str
    quantity: int = Field(1, ge=1)

class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., ge=1)

class CartItemResponse(BaseModel):
    id: str
    product_variant_id: str
    product_id: str
    product_name: str
    product_slug: str
    sku: str
    size: str
    color: str
    color_code: Optional[str] = None
    image_url: Optional[str] = None
    price: Decimal
    mrp: Decimal
    quantity: int
    stock_quantity: int
    total_price: Decimal

class CartResponse(BaseModel):
    id: str
    items: List[CartItemResponse] = []
    subtotal: Decimal = Decimal("0.00")
    discount: Decimal = Decimal("0.00")
    shipping_amount: Decimal = Decimal("0.00")
    tax_amount: Decimal = Decimal("0.00")
    total_amount: Decimal = Decimal("0.00")
    coupon_code: Optional[str] = None
    total_items: int = 0

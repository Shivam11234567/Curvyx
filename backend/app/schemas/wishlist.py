from typing import List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.product import ProductResponse

class AddWishlistRequest(BaseModel):
    product_id: str

class WishlistItemResponse(BaseModel):
    id: str
    product_id: str
    product: ProductResponse
    created_at: datetime

class WishlistResponse(BaseModel):
    id: str
    items: List[WishlistItemResponse] = []
    total_items: int = 0

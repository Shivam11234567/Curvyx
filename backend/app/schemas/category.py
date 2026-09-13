from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    name: str

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True

class CategoryTreeResponse(CategoryResponse):
    children: List["CategoryTreeResponse"] = []

CategoryTreeResponse.model_rebuild()

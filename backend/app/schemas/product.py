from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class ProductImageCreate(BaseModel):
    image_url: str
    is_primary: bool = False
    sort_order: int = 0

class ProductImageResponse(BaseModel):
    id: str
    product_id: str
    image_url: str
    is_primary: bool
    sort_order: int

    class Config:
        from_attributes = True

class ProductVariantCreate(BaseModel):
    sku: str
    size: str
    color: str
    color_code: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(0, ge=0)
    is_active: bool = True

class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    color_code: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class ProductVariantResponse(BaseModel):
    id: str
    product_id: str
    sku: str
    size: str
    color: str
    color_code: Optional[str] = None
    price: Decimal
    stock_quantity: int
    is_active: bool

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = None
    product_details: Optional[str] = None
    material: Optional[str] = None
    care_instructions: Optional[str] = None
    category_id: str
    mrp: Decimal = Field(..., gt=0)
    selling_price: Decimal = Field(..., gt=0)
    is_active: bool = True
    is_featured: bool = False
    images: Optional[List[ProductImageCreate]] = []
    variants: Optional[List[ProductVariantCreate]] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    product_details: Optional[str] = None
    material: Optional[str] = None
    care_instructions: Optional[str] = None
    category_id: Optional[str] = None
    mrp: Optional[Decimal] = Field(None, gt=0)
    selling_price: Optional[Decimal] = Field(None, gt=0)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    material: Optional[str] = None
    category_id: str
    category_name: Optional[str] = None
    mrp: Decimal
    selling_price: Decimal
    discount_percentage: Decimal
    is_active: bool
    is_featured: bool
    primary_image: Optional[str] = None
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    available_sizes: List[str] = []
    available_colors: List[str] = []
    total_stock: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductDetailResponse(ProductResponse):
    product_details: Optional[str] = None
    care_instructions: Optional[str] = None
    related_products: List[ProductResponse] = []

class ProductFilterParams(BaseModel):
    category_slug: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    min_discount: Optional[Decimal] = None
    is_featured: Optional[bool] = None
    sort_by: Optional[str] = "featured"
    page: int = 1
    page_size: int = 20
    search: Optional[str] = None

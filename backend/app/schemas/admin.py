from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class AdminDashboardMetricsResponse(BaseModel):
    total_revenue: Decimal
    total_orders: int
    pending_orders: int
    total_products: int
    low_stock_count: int
    out_of_stock_count: int
    total_customers: int
    recent_orders: List[Dict[str, Any]]
    bestsellers: List[Dict[str, Any]]

class UpdateInventoryRequest(BaseModel):
    stock_quantity: int = Field(..., ge=0)
    price: Optional[Decimal] = Field(None, gt=0)

class InventoryItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    sku: str
    size: str
    color: str
    price: Decimal
    stock_quantity: int
    is_active: bool
    status: str

class CustomerResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    orders_count: int = 0
    total_spent: Decimal = Decimal("0.00")
    created_at: datetime

    class Config:
        from_attributes = True

class SystemHealthResponse(BaseModel):
    api_status: str
    database_status: str
    payment_service_status: str
    storage_status: str
    environment: str
    timestamp: datetime

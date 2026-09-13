from typing import Dict, Any, List
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.category import Category
from app.models.product import Product
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/reports", tags=["Admin Reports"])

@router.get("", response_model=ApiResponse[Dict[str, Any]])
def admin_get_reports(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_rev = db.query(func.sum(Order.total_amount)).filter(Order.payment_status == "PAID").scalar() or Decimal("0.00")
    total_orders = db.query(Order).count()
    paid_orders = db.query(Order).filter(Order.payment_status == "PAID").count()
    aov = (total_rev / Decimal(paid_orders)) if paid_orders > 0 else Decimal("0.00")

    category_data = []
    categories = db.query(Category).all()
    for cat in categories:
        prod_count = db.query(func.count(Product.id)).filter(Product.category_id == cat.id).scalar() or 0
        category_data.append({
            "category_name": cat.name,
            "product_count": prod_count
        })

    order_status_breakdown = {}
    for st in ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]:
        cnt = db.query(Order).filter(Order.order_status == st).count()
        order_status_breakdown[st] = cnt

    return ApiResponse(
        success=True,
        data={
            "total_revenue": float(total_rev),
            "total_orders": total_orders,
            "paid_orders": paid_orders,
            "average_order_value": round(float(aov), 2),
            "category_distribution": category_data,
            "order_status_breakdown": order_status_breakdown
        }
    )

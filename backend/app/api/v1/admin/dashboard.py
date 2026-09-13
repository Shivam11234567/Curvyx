from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User
from app.schemas.admin import AdminDashboardMetricsResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/dashboard", tags=["Admin Dashboard"])

@router.get("", response_model=ApiResponse[AdminDashboardMetricsResponse])
def get_dashboard_metrics(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_rev = db.query(func.sum(Order.total_amount)).filter(Order.payment_status == "PAID").scalar() or Decimal("0.00")
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.order_status == "PENDING").count()
    total_products = db.query(Product).count()
    low_stock_count = db.query(ProductVariant).filter(
        ProductVariant.stock_quantity > 0,
        ProductVariant.stock_quantity <= 10
    ).count()
    out_of_stock_count = db.query(ProductVariant).filter(
        ProductVariant.stock_quantity == 0
    ).count()
    total_customers = db.query(User).count()

    recent_orders_query = db.query(Order).order_by(desc(Order.created_at)).limit(5).all()
    recent_orders = [
        {
            "id": o.id,
            "order_number": o.order_number,
            "total_amount": float(o.total_amount),
            "payment_status": o.payment_status,
            "order_status": o.order_status,
            "customer_name": o.shipping_address_snapshot.get("name") if o.shipping_address_snapshot else "Guest",
            "created_at": o.created_at.isoformat()
        } for o in recent_orders_query
    ]

    bestsellers_query = db.query(
        OrderItem.product_name_snapshot,
        OrderItem.sku_snapshot,
        func.sum(OrderItem.quantity).label("total_sold"),
        func.sum(OrderItem.total_price).label("total_revenue")
    ).group_by(
        OrderItem.product_name_snapshot,
        OrderItem.sku_snapshot
    ).order_by(desc("total_sold")).limit(5).all()

    bestsellers = [
        {
            "product_name": row[0],
            "sku": row[1],
            "total_sold": row[2],
            "total_revenue": float(row[3])
        } for row in bestsellers_query
    ]

    data = AdminDashboardMetricsResponse(
        total_revenue=Decimal(str(total_rev)),
        total_orders=total_orders,
        pending_orders=pending_orders,
        total_products=total_products,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        total_customers=total_customers,
        recent_orders=recent_orders,
        bestsellers=bestsellers
    )

    return ApiResponse(success=True, data=data)

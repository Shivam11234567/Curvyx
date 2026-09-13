from typing import List, Optional
from decimal import Decimal
import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.user import User
from app.models.order import Order
from app.schemas.admin import CustomerResponse
from app.schemas.common import ApiResponse, PaginationMeta

router = APIRouter(prefix="/customers", tags=["Admin Customers"])

@router.get("", response_model=ApiResponse[List[CustomerResponse]])
def admin_list_customers(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(or_(User.name.ilike(term), User.email.ilike(term), User.phone.ilike(term)))

    query = query.order_by(desc(User.created_at))
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    users = query.offset((page - 1) * page_size).limit(page_size).all()

    data = []
    for u in users:
        orders_count = db.query(Order).filter(Order.user_id == u.id).count()
        total_spent = db.query(func.sum(Order.total_amount)).filter(
            Order.user_id == u.id,
            Order.payment_status == "PAID"
        ).scalar() or Decimal("0.00")

        data.append(CustomerResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            phone=u.phone,
            is_active=u.is_active,
            orders_count=orders_count,
            total_spent=Decimal(str(total_spent)),
            created_at=u.created_at
        ))

    return ApiResponse(
        success=True,
        data=data,
        pagination=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

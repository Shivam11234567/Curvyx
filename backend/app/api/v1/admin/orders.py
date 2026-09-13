from typing import List, Optional
from decimal import Decimal
import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.schemas.order import OrderResponse, OrderDetailResponse, OrderItemResponse, UpdateOrderStatusRequest
from app.schemas.common import ApiResponse, PaginationMeta
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/orders", tags=["Admin Orders"])

def get_order_payment_method(payment: Optional[Payment]) -> str:
    if not payment:
        return "RAZORPAY"
    if (
        (payment.razorpay_order_id and payment.razorpay_order_id.startswith("COD_"))
        or payment.status == "COD_PENDING"
        or (isinstance(payment.raw_response, dict) and payment.raw_response.get("payment_method") == "COD")
    ):
        return "COD"
    return "RAZORPAY"

def serialize_admin_order_detail(order: Order, db: Session) -> OrderDetailResponse:
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    pm = get_order_payment_method(payment)

    items_resp = [
        OrderItemResponse(
            id=item.id,
            product_variant_id=item.product_variant_id,
            product_name_snapshot=item.product_name_snapshot,
            sku_snapshot=item.sku_snapshot,
            size_snapshot=item.size_snapshot,
            color_snapshot=item.color_snapshot,
            image_url_snapshot=item.image_url_snapshot,
            unit_price=Decimal(str(item.unit_price)),
            quantity=item.quantity,
            total_price=Decimal(str(item.total_price)),
            created_at=item.created_at
        ) for item in items
    ]

    return OrderDetailResponse(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        subtotal=Decimal(str(order.subtotal)),
        discount=Decimal(str(order.discount)),
        shipping_amount=Decimal(str(order.shipping_amount)),
        tax_amount=Decimal(str(order.tax_amount)),
        total_amount=Decimal(str(order.total_amount)),
        payment_status=order.payment_status,
        order_status=order.order_status,
        payment_method=pm,
        shipping_address_snapshot=order.shipping_address_snapshot,
        items_count=len(items),
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_resp,
        razorpay_order_id=payment.razorpay_order_id if payment else None,
        razorpay_payment_id=payment.razorpay_payment_id if payment else None
    )

@router.get("", response_model=ApiResponse[List[OrderResponse]])
def admin_list_orders(
    search: Optional[str] = None,
    order_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    payment_method: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(Order.order_number.ilike(term))

    if order_status:
        query = query.filter(Order.order_status == order_status.upper())
    if payment_status:
        query = query.filter(Order.payment_status == payment_status.upper())
    if payment_method:
        pm_upper = payment_method.strip().upper()
        if pm_upper == "COD":
            query = query.join(Payment, Order.id == Payment.order_id).filter(
                or_(
                    Payment.razorpay_order_id.like("COD_%"),
                    Payment.status == "COD_PENDING"
                )
            )
        elif pm_upper in ["RAZORPAY", "ONLINE"]:
            query = query.join(Payment, Order.id == Payment.order_id).filter(
                ~Payment.razorpay_order_id.like("COD_%"),
                Payment.status != "COD_PENDING"
            )

    query = query.order_by(desc(Order.created_at))
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    orders = query.offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for ord in orders:
        items_count = db.query(OrderItem).filter(OrderItem.order_id == ord.id).count()
        payment = db.query(Payment).filter(Payment.order_id == ord.id).first()
        pm = get_order_payment_method(payment)

        results.append(OrderResponse(
            id=ord.id,
            order_number=ord.order_number,
            user_id=ord.user_id,
            subtotal=Decimal(str(ord.subtotal)),
            discount=Decimal(str(ord.discount)),
            shipping_amount=Decimal(str(ord.shipping_amount)),
            tax_amount=Decimal(str(ord.tax_amount)),
            total_amount=Decimal(str(ord.total_amount)),
            payment_status=ord.payment_status,
            order_status=ord.order_status,
            payment_method=pm,
            shipping_address_snapshot=ord.shipping_address_snapshot,
            items_count=items_count,
            created_at=ord.created_at,
            updated_at=ord.updated_at
        ))

    return ApiResponse(
        success=True,
        data=results,
        pagination=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

@router.get("/{order_id}", response_model=ApiResponse[OrderDetailResponse])
def admin_get_order(
    order_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return ApiResponse(success=True, data=serialize_admin_order_detail(order, db))

@router.patch("/{order_id}/status", response_model=ApiResponse[OrderDetailResponse])
def admin_update_order_status(
    order_id: str,
    req: UpdateOrderStatusRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    old_status = order.order_status
    old_payment_status = order.payment_status

    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    pm = get_order_payment_method(payment)

    if req.order_status:
        order.order_status = req.order_status.upper()

    if req.payment_status:
        new_payment_status = req.payment_status.upper()
        if pm != "COD" and new_payment_status != old_payment_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment status for Razorpay orders is managed automatically via the Razorpay payment gateway and cannot be modified manually."
            )
        order.payment_status = new_payment_status
        if payment and pm == "COD":
            if new_payment_status == "PAID":
                payment.status = "PAID"
            elif new_payment_status == "PENDING":
                payment.status = "COD_PENDING"
            else:
                payment.status = new_payment_status

    db.commit()
    db.refresh(order)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_ORDER_STATUS",
        entity="ORDER",
        entity_id=order.id,
        details={
            "old_order_status": old_status,
            "new_order_status": order.order_status,
            "old_payment_status": old_payment_status,
            "new_payment_status": order.payment_status,
            "payment_method": pm
        }
    )

    return ApiResponse(
        success=True,
        data=serialize_admin_order_detail(order, db),
        message="Order status updated successfully"
    )

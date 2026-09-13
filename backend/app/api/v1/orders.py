from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.schemas.order import CheckoutRequest, OrderResponse, OrderDetailResponse, OrderItemResponse
from app.schemas.common import ApiResponse
from app.services.order_service import create_order_from_cart

router = APIRouter(prefix="/orders", tags=["Orders"])

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

def serialize_order_detail(order: Order, db: Session) -> OrderDetailResponse:
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

@router.post("/checkout", response_model=ApiResponse[OrderDetailResponse], status_code=status.HTTP_201_CREATED)
def checkout(
    req: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order, payment = create_order_from_cart(
        db=db,
        user_id=current_user.id,
        address_id=req.shipping_address_id,
        coupon_code=req.coupon_code,
        payment_method=req.payment_method or "RAZORPAY"
    )
    return ApiResponse(
        success=True,
        data=serialize_order_detail(order, db),
        message="Order created successfully"
    )

@router.get("", response_model=ApiResponse[List[OrderResponse]])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(desc(Order.created_at)).all()
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
    return ApiResponse(success=True, data=results)

@router.get("/{order_id}", response_model=ApiResponse[OrderDetailResponse])
def get_order_by_id(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    return ApiResponse(success=True, data=serialize_order_detail(order, db))

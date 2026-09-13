from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment
from app.schemas.payment import CreatePaymentOrderRequest, CreatePaymentOrderResponse, VerifyPaymentRequest, PaymentResponse
from app.schemas.common import ApiResponse
from app.services.payment_service import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/create-order", response_model=ApiResponse[CreatePaymentOrderResponse])
def create_payment_order(
    req: CreatePaymentOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == req.order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.payment_status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already paid"
        )

    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    if not payment:
        rzp_order = payment_service.create_razorpay_order(
            amount=Decimal(str(order.total_amount)),
            currency="INR",
            receipt=order.order_number
        )
        payment = Payment(
            order_id=order.id,
            razorpay_order_id=rzp_order["id"],
            amount=Decimal(str(order.total_amount)),
            currency="INR",
            status="CREATED"
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

    return ApiResponse(
        success=True,
        data=CreatePaymentOrderResponse(
            order_id=order.id,
            order_number=order.order_number,
            razorpay_order_id=payment.razorpay_order_id,
            amount=Decimal(str(payment.amount)),
            currency=payment.currency,
            key_id=settings.RAZORPAY_KEY_ID
        )
    )

@router.post("/verify", response_model=ApiResponse[PaymentResponse])
def verify_payment(
    req: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == req.order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    payment = db.query(Payment).filter(
        Payment.order_id == order.id,
        Payment.razorpay_order_id == req.razorpay_order_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found"
        )

    is_valid = payment_service.verify_payment_signature(
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature
    )

    if not is_valid:
        payment.status = "FAILED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment signature verification failed"
        )

    payment.razorpay_payment_id = req.razorpay_payment_id
    payment.razorpay_signature = req.razorpay_signature
    payment.status = "PAID"

    order.payment_status = "PAID"
    order.order_status = "CONFIRMED"
    db.commit()
    db.refresh(payment)

    return ApiResponse(
        success=True,
        data=PaymentResponse(
            id=payment.id,
            order_id=payment.order_id,
            razorpay_order_id=payment.razorpay_order_id,
            razorpay_payment_id=payment.razorpay_payment_id,
            amount=Decimal(str(payment.amount)),
            currency=payment.currency,
            status=payment.status
        ),
        message="Payment verified and order confirmed successfully"
    )

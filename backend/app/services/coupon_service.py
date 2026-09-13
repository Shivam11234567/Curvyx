from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.coupon import Coupon

def validate_and_apply_coupon(
    db: Session,
    code: str,
    order_subtotal: Decimal
) -> Tuple[Coupon, Decimal]:
    coupon = db.query(Coupon).filter(
        Coupon.code == code.strip().upper(),
        Coupon.is_active == True
    ).first()

    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired coupon code"
        )

    now = datetime.now(timezone.utc)
    if coupon.start_at and coupon.start_at > now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon is not yet active"
        )

    if coupon.expires_at and coupon.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon has expired"
        )

    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon usage limit reached"
        )

    if order_subtotal < Decimal(str(coupon.minimum_order_value)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order value for this coupon is ₹{coupon.minimum_order_value}"
        )

    discount_amount = Decimal("0.00")
    if coupon.discount_type == "PERCENTAGE":
        discount_amount = (order_subtotal * Decimal(str(coupon.discount_value))) / Decimal("100.00")
        if coupon.maximum_discount is not None:
            max_disc = Decimal(str(coupon.maximum_discount))
            if discount_amount > max_disc:
                discount_amount = max_disc
    elif coupon.discount_type == "FLAT":
        discount_amount = Decimal(str(coupon.discount_value))
        if discount_amount > order_subtotal:
            discount_amount = order_subtotal

    return coupon, round(discount_amount, 2)

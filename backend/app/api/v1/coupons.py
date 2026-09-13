from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.coupon import ApplyCouponResponse
from app.schemas.common import ApiResponse
from app.services.coupon_service import validate_and_apply_coupon

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.get("/validate", response_model=ApiResponse[ApplyCouponResponse])
def check_coupon(
    code: str = Query(...),
    subtotal: Decimal = Query(..., ge=0),
    db: Session = Depends(get_db)
):
    coupon, discount = validate_and_apply_coupon(db, code, subtotal)
    return ApiResponse(
        success=True,
        data=ApplyCouponResponse(
            code=coupon.code,
            discount_amount=discount,
            discount_type=coupon.discount_type,
            discount_value=Decimal(str(coupon.discount_value))
        ),
        message="Coupon applied successfully"
    )

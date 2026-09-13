from typing import List, Optional
import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponResponse
from app.schemas.common import ApiResponse, PaginationMeta
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/coupons", tags=["Admin Coupons"])

@router.get("", response_model=ApiResponse[List[CouponResponse]])
def admin_list_coupons(
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Coupon)
    if is_active is not None:
        query = query.filter(Coupon.is_active == is_active)

    query = query.order_by(desc(Coupon.created_at))
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    coupons = query.offset((page - 1) * page_size).limit(page_size).all()

    return ApiResponse(
        success=True,
        data=[CouponResponse.model_validate(c) for c in coupons],
        pagination=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

@router.post("", response_model=ApiResponse[CouponResponse], status_code=status.HTTP_201_CREATED)
def admin_create_coupon(
    req: CouponCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Coupon).filter(Coupon.code == req.code.strip().upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A coupon with this code already exists"
        )

    coupon = Coupon(
        code=req.code.strip().upper(),
        discount_type=req.discount_type.upper(),
        discount_value=req.discount_value,
        minimum_order_value=req.minimum_order_value,
        maximum_discount=req.maximum_discount,
        usage_limit=req.usage_limit,
        start_at=req.start_at,
        expires_at=req.expires_at,
        is_active=req.is_active
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="CREATE_COUPON",
        entity="COUPON",
        entity_id=coupon.id,
        details={"code": coupon.code}
    )

    return ApiResponse(
        success=True,
        data=CouponResponse.model_validate(coupon),
        message="Coupon created successfully"
    )

@router.put("/{coupon_id}", response_model=ApiResponse[CouponResponse])
def admin_update_coupon(
    coupon_id: str,
    req: CouponUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )

    update_data = req.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"]:
        new_code = update_data["code"].strip().upper()
        existing = db.query(Coupon).filter(Coupon.code == new_code, Coupon.id != coupon_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A coupon with this code already exists"
            )
        update_data["code"] = new_code

    for field, val in update_data.items():
        setattr(coupon, field, val)

    db.commit()
    db.refresh(coupon)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_COUPON",
        entity="COUPON",
        entity_id=coupon.id,
        details=update_data
    )

    return ApiResponse(
        success=True,
        data=CouponResponse.model_validate(coupon),
        message="Coupon updated successfully"
    )

@router.delete("/{coupon_id}", response_model=ApiResponse[dict])
def admin_delete_coupon(
    coupon_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )

    db.delete(coupon)
    db.commit()

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="DELETE_COUPON",
        entity="COUPON",
        entity_id=coupon_id
    )

    return ApiResponse(success=True, data={"message": "Coupon deleted successfully"})

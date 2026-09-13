from typing import List, Optional
from decimal import Decimal
import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.product_variant import ProductVariant
from app.models.product import Product
from app.schemas.admin import UpdateInventoryRequest, InventoryItemResponse
from app.schemas.common import ApiResponse, PaginationMeta
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/inventory", tags=["Admin Inventory"])

@router.get("", response_model=ApiResponse[List[InventoryItemResponse]])
def get_inventory_list(
    status_filter: Optional[str] = Query(None, regex="^(in_stock|low_stock|out_of_stock)$"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(ProductVariant, Product).join(Product, ProductVariant.product_id == Product.id)

    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                ProductVariant.sku.ilike(term),
                Product.name.ilike(term),
                ProductVariant.size.ilike(term),
                ProductVariant.color.ilike(term)
            )
        )

    if status_filter == "out_of_stock":
        query = query.filter(ProductVariant.stock_quantity == 0)
    elif status_filter == "low_stock":
        query = query.filter(ProductVariant.stock_quantity > 0, ProductVariant.stock_quantity <= 10)
    elif status_filter == "in_stock":
        query = query.filter(ProductVariant.stock_quantity > 10)

    query = query.order_by(asc(ProductVariant.stock_quantity))
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    results = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for var, prod in results:
        status_label = "OUT_OF_STOCK" if var.stock_quantity == 0 else ("LOW_STOCK" if var.stock_quantity <= 10 else "IN_STOCK")
        items.append(InventoryItemResponse(
            id=var.id,
            product_id=prod.id,
            product_name=prod.name,
            sku=var.sku,
            size=var.size,
            color=var.color,
            price=Decimal(str(var.price)),
            stock_quantity=var.stock_quantity,
            is_active=var.is_active,
            status=status_label
        ))

    return ApiResponse(
        success=True,
        data=items,
        pagination=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

@router.patch("/{variant_id}", response_model=ApiResponse[InventoryItemResponse])
def update_inventory_stock(
    variant_id: str,
    req: UpdateInventoryRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )

    old_stock = variant.stock_quantity
    old_price = variant.price
    variant.stock_quantity = req.stock_quantity
    if req.price is not None:
        variant.price = req.price

    db.commit()
    db.refresh(variant)

    product = db.query(Product).filter(Product.id == variant.product_id).first()

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_INVENTORY",
        entity="PRODUCT_VARIANT",
        entity_id=variant.id,
        details={
            "sku": variant.sku,
            "old_stock": old_stock,
            "new_stock": variant.stock_quantity,
            "old_price": str(old_price),
            "new_price": str(variant.price)
        }
    )

    status_label = "OUT_OF_STOCK" if variant.stock_quantity == 0 else ("LOW_STOCK" if variant.stock_quantity <= 10 else "IN_STOCK")
    return ApiResponse(
        success=True,
        data=InventoryItemResponse(
            id=variant.id,
            product_id=product.id if product else "",
            product_name=product.name if product else "",
            sku=variant.sku,
            size=variant.size,
            color=variant.color,
            price=Decimal(str(variant.price)),
            stock_quantity=variant.stock_quantity,
            is_active=variant.is_active,
            status=status_label
        ),
        message="Inventory updated successfully"
    )

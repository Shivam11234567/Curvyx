from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.product_variant import ProductVariant

def check_variant_stock(db: Session, variant_id: str, requested_qty: int) -> ProductVariant:
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == variant_id,
        ProductVariant.is_active == True
    ).with_for_update().first() if db.bind.dialect.name != "sqlite" else db.query(ProductVariant).filter(
        ProductVariant.id == variant_id,
        ProductVariant.is_active == True
    ).first()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product variant not found or inactive"
        )

    if variant.stock_quantity < requested_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for {variant.sku}. Available: {variant.stock_quantity}, requested: {requested_qty}"
        )

    return variant

def deduct_variant_stock(db: Session, variant_id: str, quantity: int) -> ProductVariant:
    variant = check_variant_stock(db, variant_id, quantity)
    variant.stock_quantity -= quantity
    db.add(variant)
    return variant

def restore_variant_stock(db: Session, variant_id: str, quantity: int) -> ProductVariant:
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if variant:
        variant.stock_quantity += quantity
        db.add(variant)
    return variant

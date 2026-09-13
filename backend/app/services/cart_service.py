from decimal import Decimal
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product_variant import ProductVariant
from app.models.product import Product
from app.models.product_image import ProductImage
from app.services.coupon_service import validate_and_apply_coupon

def get_or_create_cart(db: Session, user_id: str) -> Cart:
    cart = db.query(Cart).filter(Cart.id == user_id or Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

def get_cart_details(db: Session, user_id: str, coupon_code: Optional[str] = None) -> Dict[str, Any]:
    cart = get_or_create_cart(db, user_id)
    items_data = []
    subtotal = Decimal("0.00")
    total_items = 0

    for item in cart.items:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item.product_variant_id).first()
        if not variant or not variant.is_active:
            continue
        product = db.query(Product).filter(Product.id == variant.product_id).first()
        if not product or not product.is_active:
            continue

        primary_image = db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.is_primary == True
        ).first()
        if not primary_image:
            primary_image = db.query(ProductImage).filter(
                ProductImage.product_id == product.id
            ).order_by(ProductImage.sort_order).first()

        item_unit_price = Decimal(str(variant.price))
        item_total = item_unit_price * Decimal(item.quantity)
        subtotal += item_total
        total_items += item.quantity

        items_data.append({
            "id": item.id,
            "product_variant_id": variant.id,
            "product_id": product.id,
            "product_name": product.name,
            "product_slug": product.slug,
            "sku": variant.sku,
            "size": variant.size,
            "color": variant.color,
            "color_code": variant.color_code,
            "image_url": primary_image.image_url if primary_image else None,
            "price": item_unit_price,
            "mrp": Decimal(str(product.mrp)),
            "quantity": item.quantity,
            "stock_quantity": variant.stock_quantity,
            "total_price": item_total,
        })

    discount_amount = Decimal("0.00")
    applied_coupon_code = None
    if coupon_code and subtotal > Decimal("0.00"):
        try:
            coupon, discount_amount = validate_and_apply_coupon(db, coupon_code, subtotal)
            applied_coupon_code = coupon.code
        except HTTPException:
            discount_amount = Decimal("0.00")
            applied_coupon_code = None

    shipping_amount = Decimal("0.00") if subtotal >= Decimal("999.00") or subtotal == Decimal("0.00") else Decimal("99.00")
    tax_amount = round((subtotal - discount_amount) * Decimal("0.05"), 2) if (subtotal - discount_amount) > Decimal("0.00") else Decimal("0.00")
    total_amount = max(Decimal("0.00"), subtotal - discount_amount + shipping_amount + tax_amount)

    return {
        "id": cart.id,
        "items": items_data,
        "subtotal": subtotal,
        "discount": discount_amount,
        "shipping_amount": shipping_amount,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "coupon_code": applied_coupon_code,
        "total_items": total_items
    }

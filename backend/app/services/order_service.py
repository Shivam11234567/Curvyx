import random
import string
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.address import Address
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product_variant import ProductVariant
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.payment import Payment
from app.models.coupon import Coupon
from app.services.inventory_service import deduct_variant_stock
from app.services.coupon_service import validate_and_apply_coupon
from app.services.payment_service import payment_service

def generate_order_number() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ELORA-{timestamp}-{suffix}"

def create_order_from_cart(
    db: Session,
    user_id: str,
    address_id: str,
    coupon_code: Optional[str] = None,
    payment_method: str = "RAZORPAY"
) -> Tuple[Order, Payment]:
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == user_id
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping address not found"
        )

    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty"
        )

    address_snapshot = {
        "name": address.name,
        "phone": address.phone,
        "address_line_1": address.address_line_1,
        "address_line_2": address.address_line_2,
        "city": address.city,
        "state": address.state,
        "postal_code": address.postal_code,
        "country": address.country
    }

    subtotal = Decimal("0.00")
    order_items_to_create = []

    for item in cart.items:
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == item.product_variant_id,
            ProductVariant.is_active == True
        ).first()

        if not variant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more items in your cart are no longer available"
            )

        if variant.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {variant.sku}. Available: {variant.stock_quantity}, in cart: {item.quantity}"
            )

        product = db.query(Product).filter(Product.id == variant.product_id).first()
        primary_img = db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.is_primary == True
        ).first()
        if not primary_img:
            primary_img = db.query(ProductImage).filter(
                ProductImage.product_id == product.id
            ).order_by(ProductImage.sort_order).first()

        unit_price = Decimal(str(variant.price))
        total_price = unit_price * Decimal(item.quantity)
        subtotal += total_price

        order_items_to_create.append({
            "variant": variant,
            "product": product,
            "image_url": primary_img.image_url if primary_img else None,
            "unit_price": unit_price,
            "quantity": item.quantity,
            "total_price": total_price
        })

    discount_amount = Decimal("0.00")
    applied_coupon = None
    if coupon_code and subtotal > Decimal("0.00"):
        applied_coupon, discount_amount = validate_and_apply_coupon(db, coupon_code, subtotal)

    shipping_amount = Decimal("0.00") if subtotal >= Decimal("999.00") else Decimal("99.00")
    taxable_amount = max(Decimal("0.00"), subtotal - discount_amount)
    tax_amount = round(taxable_amount * Decimal("0.05"), 2)
    final_total = taxable_amount + shipping_amount + tax_amount

    is_cod = str(payment_method).upper() in ["COD", "CASH_ON_DELIVERY"]
    order_number = generate_order_number()
    order = Order(
        user_id=user_id,
        order_number=order_number,
        subtotal=subtotal,
        discount=discount_amount,
        shipping_amount=shipping_amount,
        tax_amount=tax_amount,
        total_amount=final_total,
        payment_status="PENDING",
        order_status="CONFIRMED" if is_cod else "PENDING",
        shipping_address_snapshot=address_snapshot
    )
    db.add(order)
    db.flush()

    for item_data in order_items_to_create:
        var = item_data["variant"]
        prod = item_data["product"]
        order_item = OrderItem(
            order_id=order.id,
            product_variant_id=var.id,
            product_name_snapshot=prod.name,
            sku_snapshot=var.sku,
            size_snapshot=var.size,
            color_snapshot=var.color,
            image_url_snapshot=item_data["image_url"],
            unit_price=item_data["unit_price"],
            quantity=item_data["quantity"],
            total_price=item_data["total_price"]
        )
        db.add(order_item)
        deduct_variant_stock(db, var.id, item_data["quantity"])

    if applied_coupon:
        applied_coupon.used_count += 1
        db.add(applied_coupon)

    if is_cod:
        payment = Payment(
            order_id=order.id,
            razorpay_order_id=f"COD_{order.order_number}",
            amount=final_total,
            currency="INR",
            status="COD_PENDING",
            raw_response={"payment_method": "COD"}
        )
    else:
        rzp_order = payment_service.create_razorpay_order(
            amount=final_total,
            currency="INR",
            receipt=order.order_number
        )
        payment = Payment(
            order_id=order.id,
            razorpay_order_id=rzp_order["id"],
            amount=final_total,
            currency="INR",
            status="CREATED"
        )
    db.add(payment)

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(order)
    db.refresh(payment)

    return order, payment

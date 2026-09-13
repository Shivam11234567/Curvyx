from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.cart_item import CartItem
from app.models.product_variant import ProductVariant
from app.schemas.cart import AddToCartRequest, UpdateCartItemRequest, CartResponse
from app.schemas.common import ApiResponse
from app.services.cart_service import get_or_create_cart, get_cart_details
from app.services.inventory_service import check_variant_stock

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("", response_model=ApiResponse[CartResponse])
def get_cart(
    coupon_code: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_data = get_cart_details(db, current_user.id, coupon_code)
    return ApiResponse(success=True, data=CartResponse(**cart_data))

@router.post("/items", response_model=ApiResponse[CartResponse], status_code=status.HTTP_201_CREATED)
def add_item_to_cart(
    req: AddToCartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_variant_stock(db, req.product_variant_id, req.quantity)
    cart = get_or_create_cart(db, current_user.id)

    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_variant_id == req.product_variant_id
    ).first()

    if existing_item:
        new_quantity = existing_item.quantity + req.quantity
        check_variant_stock(db, req.product_variant_id, new_quantity)
        existing_item.quantity = new_quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_variant_id=req.product_variant_id,
            quantity=req.quantity
        )
        db.add(new_item)

    db.commit()
    cart_data = get_cart_details(db, current_user.id)
    return ApiResponse(success=True, data=CartResponse(**cart_data), message="Item added to cart")

@router.patch("/items/{item_id}", response_model=ApiResponse[CartResponse])
def update_cart_item(
    item_id: str,
    req: UpdateCartItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(db, current_user.id)
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    check_variant_stock(db, item.product_variant_id, req.quantity)
    item.quantity = req.quantity
    db.commit()

    cart_data = get_cart_details(db, current_user.id)
    return ApiResponse(success=True, data=CartResponse(**cart_data), message="Cart updated")

@router.delete("/items/{item_id}", response_model=ApiResponse[CartResponse])
def delete_cart_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(db, current_user.id)
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    db.delete(item)
    db.commit()

    cart_data = get_cart_details(db, current_user.id)
    return ApiResponse(success=True, data=CartResponse(**cart_data), message="Item removed from cart")

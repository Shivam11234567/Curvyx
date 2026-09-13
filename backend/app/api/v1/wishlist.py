from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.wishlist import Wishlist
from app.models.wishlist_item import WishlistItem
from app.models.product import Product
from app.schemas.wishlist import AddWishlistRequest, WishlistResponse, WishlistItemResponse
from app.schemas.common import ApiResponse
from app.api.v1.products import serialize_product

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

def get_or_create_wishlist(db: Session, user_id: str) -> Wishlist:
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == user_id).first()
    if not wishlist:
        wishlist = Wishlist(user_id=user_id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)
    return wishlist

def serialize_wishlist(db: Session, wishlist: Wishlist) -> WishlistResponse:
    items_data = []
    for item in wishlist.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active == True
        ).first()
        if not product:
            continue
        prod_resp = serialize_product(product, db)
        items_data.append(WishlistItemResponse(
            id=item.id,
            product_id=product.id,
            product=prod_resp,
            created_at=item.created_at
        ))
    return WishlistResponse(
        id=wishlist.id,
        items=items_data,
        total_items=len(items_data)
    )

@router.get("", response_model=ApiResponse[WishlistResponse])
def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wishlist = get_or_create_wishlist(db, current_user.id)
    return ApiResponse(success=True, data=serialize_wishlist(db, wishlist))

@router.post("", response_model=ApiResponse[WishlistResponse], status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    req: AddWishlistRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == req.product_id,
        Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    wishlist = get_or_create_wishlist(db, current_user.id)
    existing = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wishlist.id,
        WishlistItem.product_id == req.product_id
    ).first()

    if not existing:
        item = WishlistItem(wishlist_id=wishlist.id, product_id=req.product_id)
        db.add(item)
        db.commit()

    return ApiResponse(
        success=True,
        data=serialize_wishlist(db, wishlist),
        message="Item added to wishlist"
    )

@router.delete("/{product_id}", response_model=ApiResponse[WishlistResponse])
def remove_from_wishlist(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wishlist = get_or_create_wishlist(db, current_user.id)
    item = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wishlist.id,
        WishlistItem.product_id == product_id
    ).first()

    if item:
        db.delete(item)
        db.commit()

    return ApiResponse(
        success=True,
        data=serialize_wishlist(db, wishlist),
        message="Item removed from wishlist"
    )

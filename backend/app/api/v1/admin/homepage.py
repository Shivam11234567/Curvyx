from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.product import Product
from app.models.category import Category
from app.schemas.common import ApiResponse
from app.api.v1.products import serialize_product

router = APIRouter(prefix="/homepage", tags=["Admin Homepage"])

@router.get("", response_model=ApiResponse[Dict[str, Any]])
def admin_get_homepage_config(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    featured_products = db.query(Product).filter(Product.is_featured == True, Product.is_active == True).limit(8).all()
    categories = db.query(Category).filter(Category.is_active == True).limit(6).all()

    data = {
        "hero_banners": [
            {
                "id": "1",
                "title": "Unmatched Comfort. Pure Confidence.",
                "subtitle": "Discover our bestselling everyday lingerie and wire-free bras designed for every curve.",
                "cta_text": "Shop New Collection",
                "cta_link": "/category/bras",
                "image_url": "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=1200&auto=format&fit=crop&q=80"
            },
            {
                "id": "2",
                "title": "Everyday Essentials Redefined",
                "subtitle": "Breathable cottons, seamless cuts, and flattering fits for all-day ease.",
                "cta_text": "Explore Panties",
                "cta_link": "/category/panties",
                "image_url": "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=1200&auto=format&fit=crop&q=80"
            }
        ],
        "featured_products": [serialize_product(p, db).model_dump() for p in featured_products],
        "featured_categories": [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "image_url": c.image_url
            } for c in categories
        ],
        "announcement": "Free shipping on all orders over ₹999 | Use code FIRST10 for 10% OFF"
    }

    return ApiResponse(success=True, data=data)

from typing import List, Optional
from decimal import Decimal
import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse
from app.schemas.common import ApiResponse, PaginationMeta
from app.api.v1.products import serialize_product

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=ApiResponse[List[ProductResponse]])
def search_products(
    q: str = Query("", min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    search_term = f"%{q.strip().lower()}%"
    query = db.query(Product).filter(
        Product.is_active == True,
        or_(
            Product.name.ilike(search_term),
            Product.description.ilike(search_term),
            Product.material.ilike(search_term)
        )
    ).order_by(desc(Product.is_featured), desc(Product.created_at))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    products = query.offset((page - 1) * page_size).limit(page_size).all()

    data = [serialize_product(p, db) for p in products]

    return ApiResponse(
        success=True,
        data=data,
        pagination=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

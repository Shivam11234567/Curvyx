from typing import List, Optional
from decimal import Decimal
import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.db.session import get_db
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_variant import ProductVariant
from app.models.category import Category
from app.schemas.product import ProductResponse, ProductDetailResponse, ProductImageResponse, ProductVariantResponse
from app.schemas.common import ApiResponse, PaginationMeta

router = APIRouter(prefix="/products", tags=["Products"])

def serialize_product(product: Product, db: Session) -> ProductResponse:
    images = db.query(ProductImage).filter(ProductImage.product_id == product.id).order_by(ProductImage.sort_order).all()
    variants = db.query(ProductVariant).filter(
        ProductVariant.product_id == product.id,
        ProductVariant.is_active == True
    ).all()
    category = db.query(Category).filter(Category.id == product.category_id).first()

    primary_img = None
    for img in images:
        if img.is_primary:
            primary_img = img.image_url
            break
    if not primary_img and images:
        primary_img = images[0].image_url

    sizes = list(dict.fromkeys([v.size for v in variants]))
    colors = list(dict.fromkeys([v.color for v in variants]))
    total_stock = sum(v.stock_quantity for v in variants)

    return ProductResponse(
        id=product.id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        material=product.material,
        category_id=product.category_id,
        category_name=category.name if category else None,
        mrp=Decimal(str(product.mrp)),
        selling_price=Decimal(str(product.selling_price)),
        discount_percentage=Decimal(str(product.discount_percentage)),
        is_active=product.is_active,
        is_featured=product.is_featured,
        primary_image=primary_img,
        images=[ProductImageResponse.model_validate(img) for img in images],
        variants=[ProductVariantResponse.model_validate(v) for v in variants],
        available_sizes=sizes,
        available_colors=colors,
        total_stock=total_stock,
        created_at=product.created_at,
        updated_at=product.updated_at
    )

@router.get("", response_model=ApiResponse[List[ProductResponse]])
def list_products(
    category_slug: Optional[str] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    min_discount: Optional[Decimal] = None,
    is_featured: Optional[bool] = None,
    sort_by: Optional[str] = Query("featured", pattern="^(featured|newest|price_asc|price_desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    if category_slug:
        cat = db.query(Category).filter(Category.slug == category_slug, Category.is_active == True).first()
        if cat:
            subcat_ids = [c.id for c in db.query(Category).filter(Category.parent_id == cat.id).all()]
            all_cat_ids = [cat.id] + subcat_ids
            query = query.filter(Product.category_id.in_(all_cat_ids))
        else:
            return ApiResponse(
                success=True,
                data=[],
                pagination=PaginationMeta(total=0, page=page, page_size=page_size, total_pages=0)
            )

    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)

    if min_price is not None:
        query = query.filter(Product.selling_price >= min_price)

    if max_price is not None:
        query = query.filter(Product.selling_price <= max_price)

    if min_discount is not None:
        query = query.filter(Product.discount_percentage >= min_discount)

    if size or color:
        variant_subquery = db.query(ProductVariant.product_id).filter(ProductVariant.is_active == True)
        if size:
            variant_subquery = variant_subquery.filter(func.lower(ProductVariant.size) == size.lower().strip())
        if color:
            variant_subquery = variant_subquery.filter(ProductVariant.color.ilike(f"%{color.strip()}%"))
        query = query.filter(Product.id.in_(variant_subquery))

    if sort_by == "newest":
        query = query.order_by(desc(Product.created_at))
    elif sort_by == "price_asc":
        query = query.order_by(asc(Product.selling_price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.selling_price))
    else:
        query = query.order_by(desc(Product.is_featured), desc(Product.created_at))

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

@router.get("/{slug}", response_model=ApiResponse[ProductDetailResponse])
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.slug == slug,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    base_product = serialize_product(product, db)

    related_prods = db.query(Product).filter(
        Product.category_id == product.category_id,
        Product.id != product.id,
        Product.is_active == True
    ).limit(4).all()

    related_data = [serialize_product(p, db) for p in related_prods]

    detail_resp = ProductDetailResponse(
        **base_product.model_dump(),
        product_details=product.product_details,
        care_instructions=product.care_instructions,
        related_products=related_data
    )

    return ApiResponse(success=True, data=detail_resp)

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryResponse, CategoryTreeResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=ApiResponse[List[CategoryResponse]])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.is_active == True).all()
    results = []
    for cat in categories:
        count = db.query(func.count(Product.id)).filter(
            Product.category_id == cat.id,
            Product.is_active == True
        ).scalar() or 0
        resp = CategoryResponse(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            parent_id=cat.parent_id,
            image_url=cat.image_url,
            is_active=cat.is_active,
            created_at=cat.created_at,
            updated_at=cat.updated_at,
            product_count=count
        )
        results.append(resp)
    return ApiResponse(success=True, data=results)

@router.get("/tree", response_model=ApiResponse[List[CategoryTreeResponse]])
def get_category_tree(db: Session = Depends(get_db)):
    top_categories = db.query(Category).filter(
        Category.parent_id == None,
        Category.is_active == True
    ).all()

    def build_node(cat: Category) -> CategoryTreeResponse:
        count = db.query(func.count(Product.id)).filter(
            Product.category_id == cat.id,
            Product.is_active == True
        ).scalar() or 0
        children = [build_node(child) for child in cat.children if child.is_active]
        return CategoryTreeResponse(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            parent_id=cat.parent_id,
            image_url=cat.image_url,
            is_active=cat.is_active,
            created_at=cat.created_at,
            updated_at=cat.updated_at,
            product_count=count,
            children=children
        )

    tree = [build_node(cat) for cat in top_categories]
    return ApiResponse(success=True, data=tree)

@router.get("/{slug}", response_model=ApiResponse[CategoryResponse])
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(
        Category.slug == slug,
        Category.is_active == True
    ).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    count = db.query(func.count(Product.id)).filter(
        Product.category_id == cat.id,
        Product.is_active == True
    ).scalar() or 0

    resp = CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        parent_id=cat.parent_id,
        image_url=cat.image_url,
        is_active=cat.is_active,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
        product_count=count
    )
    return ApiResponse(success=True, data=resp)

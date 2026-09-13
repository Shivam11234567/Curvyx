import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.common import ApiResponse
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/categories", tags=["Admin Categories"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)

@router.get("", response_model=ApiResponse[List[CategoryResponse]])
def admin_get_categories(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    categories = db.query(Category).all()
    results = []
    for cat in categories:
        count = db.query(func.count(Product.id)).filter(Product.category_id == cat.id).scalar() or 0
        results.append(CategoryResponse(
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
        ))
    return ApiResponse(success=True, data=results)

@router.post("", response_model=ApiResponse[CategoryResponse], status_code=status.HTTP_201_CREATED)
def admin_create_category(
    req: CategoryCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    slug = req.slug.strip() if req.slug else slugify(req.name)
    existing = db.query(Category).filter(Category.slug == slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this slug already exists"
        )

    cat = Category(
        name=req.name.strip(),
        slug=slug,
        description=req.description,
        parent_id=req.parent_id,
        image_url=req.image_url,
        is_active=req.is_active
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="CREATE_CATEGORY",
        entity="CATEGORY",
        entity_id=cat.id,
        details={"name": cat.name, "slug": cat.slug}
    )

    return ApiResponse(
        success=True,
        data=CategoryResponse(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            parent_id=cat.parent_id,
            image_url=cat.image_url,
            is_active=cat.is_active,
            created_at=cat.created_at,
            updated_at=cat.updated_at,
            product_count=0
        ),
        message="Category created successfully"
    )

@router.put("/{category_id}", response_model=ApiResponse[CategoryResponse])
def admin_update_category(
    category_id: str,
    req: CategoryUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    update_data = req.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"]:
        existing = db.query(Category).filter(Category.slug == update_data["slug"], Category.id != category_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A category with this slug already exists"
            )

    for field, val in update_data.items():
        setattr(cat, field, val)

    db.commit()
    db.refresh(cat)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_CATEGORY",
        entity="CATEGORY",
        entity_id=cat.id,
        details=update_data
    )

    count = db.query(func.count(Product.id)).filter(Product.category_id == cat.id).scalar() or 0

    return ApiResponse(
        success=True,
        data=CategoryResponse(
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
        ),
        message="Category updated successfully"
    )

@router.delete("/{category_id}", response_model=ApiResponse[dict])
def admin_delete_category(
    category_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    prods_count = db.query(Product).filter(Product.category_id == category_id).count()
    if prods_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {prods_count} associated products"
        )

    db.delete(cat)
    db.commit()

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="DELETE_CATEGORY",
        entity="CATEGORY",
        entity_id=category_id
    )

    return ApiResponse(success=True, data={"message": "Category deleted successfully"})

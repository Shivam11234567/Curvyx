from typing import List, Optional
from decimal import Decimal
import re
import math
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_variant import ProductVariant
from app.models.category import Category
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductVariantCreate,
    ProductVariantUpdate, ProductVariantResponse, ProductImageCreate, ProductImageResponse
)
from app.schemas.common import ApiResponse, PaginationMeta
from app.services.storage_service import storage_service
from app.services.audit_service import log_admin_action
from app.api.v1.products import serialize_product

router = APIRouter(prefix="/products", tags=["Admin Products"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)

@router.get("", response_model=ApiResponse[List[ProductResponse]])
def admin_list_products(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(or_(Product.name.ilike(term), Product.slug.ilike(term)))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    query = query.order_by(desc(Product.created_at))
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

@router.post("", response_model=ApiResponse[ProductResponse], status_code=status.HTTP_201_CREATED)
def admin_create_product(
    req: ProductCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == req.category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    slug = req.slug.strip() if req.slug else slugify(req.name)
    existing_slug = db.query(Product).filter(Product.slug == slug).first()
    if existing_slug:
        slug = f"{slug}-{int(Decimal(str(req.mrp)))}"

    discount = Decimal("0.00")
    if req.mrp > 0 and req.mrp > req.selling_price:
        discount = round(((req.mrp - req.selling_price) / req.mrp) * Decimal("100.00"), 2)

    product = Product(
        name=req.name.strip(),
        slug=slug,
        description=req.description,
        product_details=req.product_details,
        material=req.material,
        care_instructions=req.care_instructions,
        category_id=req.category_id,
        mrp=req.mrp,
        selling_price=req.selling_price,
        discount_percentage=discount,
        is_active=req.is_active,
        is_featured=req.is_featured
    )
    db.add(product)
    db.flush()

    if req.images:
        for idx, img in enumerate(req.images):
            prod_img = ProductImage(
                product_id=product.id,
                image_url=img.image_url,
                is_primary=img.is_primary if idx > 0 else True,
                sort_order=img.sort_order if img.sort_order != 0 else idx
            )
            db.add(prod_img)

    if req.variants:
        for var in req.variants:
            existing_sku = db.query(ProductVariant).filter(ProductVariant.sku == var.sku).first()
            if existing_sku:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Variant SKU {var.sku} already exists"
                )
            prod_var = ProductVariant(
                product_id=product.id,
                sku=var.sku.strip(),
                size=var.size.strip(),
                color=var.color.strip(),
                color_code=var.color_code,
                price=var.price,
                stock_quantity=var.stock_quantity,
                is_active=var.is_active
            )
            db.add(prod_var)

    db.commit()
    db.refresh(product)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="CREATE_PRODUCT",
        entity="PRODUCT",
        entity_id=product.id,
        details={"name": product.name, "slug": product.slug}
    )

    return ApiResponse(
        success=True,
        data=serialize_product(product, db),
        message="Product created successfully"
    )

@router.get("/{product_id}", response_model=ApiResponse[ProductResponse])
def admin_get_product(
    product_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return ApiResponse(success=True, data=serialize_product(product, db))

@router.put("/{product_id}", response_model=ApiResponse[ProductResponse])
def admin_update_product(
    product_id: str,
    req: ProductUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(product, field, val)

    if product.mrp > 0 and product.mrp > product.selling_price:
        product.discount_percentage = round(((product.mrp - product.selling_price) / product.mrp) * Decimal("100.00"), 2)

    db.commit()
    db.refresh(product)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_PRODUCT",
        entity="PRODUCT",
        entity_id=product.id,
        details=update_data
    )

    return ApiResponse(
        success=True,
        data=serialize_product(product, db),
        message="Product updated successfully"
    )

@router.delete("/{product_id}", response_model=ApiResponse[dict])
def admin_delete_product(
    product_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="DELETE_PRODUCT",
        entity="PRODUCT",
        entity_id=product_id
    )

    return ApiResponse(success=True, data={"message": "Product deleted successfully"})

@router.post("/{product_id}/images", response_model=ApiResponse[ProductImageResponse])
async def admin_upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    is_primary: bool = False,
    sort_order: int = 0,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    image_url = await storage_service.upload_image(file)

    if is_primary:
        db.query(ProductImage).filter(ProductImage.product_id == product_id).update({"is_primary": False})

    existing_images_count = db.query(ProductImage).filter(ProductImage.product_id == product_id).count()
    if existing_images_count == 0:
        is_primary = True

    prod_img = ProductImage(
        product_id=product.id,
        image_url=image_url,
        is_primary=is_primary,
        sort_order=sort_order
    )
    db.add(prod_img)
    db.commit()
    db.refresh(prod_img)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPLOAD_IMAGE",
        entity="PRODUCT_IMAGE",
        entity_id=prod_img.id
    )

    return ApiResponse(
        success=True,
        data=ProductImageResponse.model_validate(prod_img),
        message="Image uploaded successfully"
    )

@router.delete("/images/{image_id}", response_model=ApiResponse[dict])
def admin_delete_product_image(
    image_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    img = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if not img:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )

    storage_service.delete_image(img.image_url)
    db.delete(img)
    db.commit()

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="DELETE_IMAGE",
        entity="PRODUCT_IMAGE",
        entity_id=image_id
    )

    return ApiResponse(success=True, data={"message": "Image deleted successfully"})

@router.post("/{product_id}/variants", response_model=ApiResponse[ProductVariantResponse])
def admin_add_variant(
    product_id: str,
    req: ProductVariantCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    existing_sku = db.query(ProductVariant).filter(ProductVariant.sku == req.sku).first()
    if existing_sku:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Variant SKU {req.sku} already exists"
        )

    variant = ProductVariant(
        product_id=product.id,
        sku=req.sku.strip(),
        size=req.size.strip(),
        color=req.color.strip(),
        color_code=req.color_code,
        price=req.price,
        stock_quantity=req.stock_quantity,
        is_active=req.is_active
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="ADD_VARIANT",
        entity="PRODUCT_VARIANT",
        entity_id=variant.id
    )

    return ApiResponse(
        success=True,
        data=ProductVariantResponse.model_validate(variant),
        message="Variant added successfully"
    )

@router.put("/variants/{variant_id}", response_model=ApiResponse[ProductVariantResponse])
def admin_update_variant(
    variant_id: str,
    req: ProductVariantUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )

    if req.sku and req.sku != variant.sku:
        existing = db.query(ProductVariant).filter(ProductVariant.sku == req.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Variant SKU {req.sku} already exists"
            )

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(variant, field, val)

    db.commit()
    db.refresh(variant)

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_VARIANT",
        entity="PRODUCT_VARIANT",
        entity_id=variant.id,
        details=update_data
    )

    return ApiResponse(
        success=True,
        data=ProductVariantResponse.model_validate(variant),
        message="Variant updated successfully"
    )

@router.delete("/variants/{variant_id}", response_model=ApiResponse[dict])
def admin_delete_variant(
    variant_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )

    db.delete(variant)
    db.commit()

    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="DELETE_VARIANT",
        entity="PRODUCT_VARIANT",
        entity_id=variant_id
    )

    return ApiResponse(success=True, data={"message": "Variant deleted successfully"})

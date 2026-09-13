from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/addresses", tags=["Addresses"])

@router.get("", response_model=ApiResponse[List[AddressResponse]])
def get_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addresses = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()
    return ApiResponse(success=True, data=[AddressResponse.model_validate(a) for a in addresses])

@router.post("", response_model=ApiResponse[AddressResponse], status_code=status.HTTP_201_CREATED)
def create_address(
    req: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    count = db.query(Address).filter(Address.user_id == current_user.id).count()
    is_default = req.is_default or (count == 0)

    address = Address(
        user_id=current_user.id,
        name=req.name.strip(),
        phone=req.phone.strip(),
        address_line_1=req.address_line_1.strip(),
        address_line_2=req.address_line_2.strip() if req.address_line_2 else None,
        city=req.city.strip(),
        state=req.state.strip(),
        postal_code=req.postal_code.strip(),
        country=req.country.strip(),
        is_default=is_default
    )
    db.add(address)
    db.commit()
    db.refresh(address)

    return ApiResponse(
        success=True,
        data=AddressResponse.model_validate(address),
        message="Address created successfully"
    )

@router.put("/{address_id}", response_model=ApiResponse[AddressResponse])
def update_address(
    address_id: str,
    req: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )

    if req.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)

    return ApiResponse(
        success=True,
        data=AddressResponse.model_validate(address),
        message="Address updated successfully"
    )

@router.delete("/{address_id}", response_model=ApiResponse[dict])
def delete_address(
    address_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )

    db.delete(address)
    db.commit()

    return ApiResponse(success=True, data={"message": "Address deleted successfully"})

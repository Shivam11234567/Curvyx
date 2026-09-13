from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.schemas.auth import AdminLoginRequest, AdminAuthSuccessResponse, AdminUserResponse, TokenResponse
from app.schemas.common import ApiResponse
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/auth", tags=["Admin Auth"])

@router.post("/login", response_model=ApiResponse[AdminAuthSuccessResponse])
def admin_login(req: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == req.email.lower().strip()).first()
    if not admin or not verify_password(req.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account has been deactivated"
        )

    expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": admin.id, "email": admin.email, "role": admin.role},
        expires_delta=expires_delta
    )

    log_admin_action(
        db=db,
        admin_id=admin.id,
        action="LOGIN",
        entity="ADMIN_USER",
        entity_id=admin.id
    )

    return ApiResponse(
        success=True,
        data=AdminAuthSuccessResponse(
            admin=AdminUserResponse.model_validate(admin),
            token=TokenResponse(
                access_token=token,
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
        ),
        message="Admin login successful"
    )

@router.post("/logout", response_model=ApiResponse[dict])
def admin_logout(current_admin: AdminUser = Depends(get_current_admin)):
    return ApiResponse(success=True, data={"message": "Admin logged out successfully"})

@router.get("/me", response_model=ApiResponse[AdminUserResponse])
def get_current_admin_profile(current_admin: AdminUser = Depends(get_current_admin)):
    return ApiResponse(success=True, data=AdminUserResponse.model_validate(current_admin))

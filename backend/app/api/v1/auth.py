from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, AuthSuccessResponse, UserResponse, TokenResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/auth", tags=["Customer Auth"])

@router.post("/register", response_model=ApiResponse[AuthSuccessResponse], status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )
    if req.phone:
        existing_phone = db.query(User).filter(User.phone == req.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this phone number already exists"
            )

    user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        phone=req.phone.strip() if req.phone else None,
        password_hash=get_password_hash(req.password),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": "customer"},
        expires_delta=expires_delta
    )

    return ApiResponse(
        success=True,
        data=AuthSuccessResponse(
            user=UserResponse.model_validate(user),
            token=TokenResponse(
                access_token=token,
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
        ),
        message="Registration successful"
    )

@router.post("/login", response_model=ApiResponse[AuthSuccessResponse])
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated"
        )

    expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": "customer"},
        expires_delta=expires_delta
    )

    return ApiResponse(
        success=True,
        data=AuthSuccessResponse(
            user=UserResponse.model_validate(user),
            token=TokenResponse(
                access_token=token,
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
        ),
        message="Login successful"
    )

@router.post("/logout", response_model=ApiResponse[dict])
def logout(current_user: User = Depends(get_current_user)):
    return ApiResponse(success=True, data={"message": "Logged out successfully"})

@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(success=True, data=UserResponse.model_validate(current_user))

import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from app.db.session import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    AuthSuccessResponse,
    UserResponse,
    TokenResponse,
)
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

@router.post("/google", response_model=ApiResponse[AuthSuccessResponse])
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    email: str | None = None
    name: str | None = None

    if req.credential:
        try:
            id_info = id_token.verify_oauth2_token(
                req.credential,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None,
            )
            email = id_info.get("email")
            name = id_info.get("name") or (f"{id_info.get('given_name', '')} {id_info.get('family_name', '')}").strip()
            email_verified = id_info.get("email_verified", True)
            if not email_verified:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google email address is not verified",
                )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}",
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to verify Google token: {str(e)}",
            )
    elif req.email:
        if settings.ENVIRONMENT != "development":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google credential token is required",
            )
        email = req.email
        name = req.name
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google credential token is required",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email could not be extracted from Google token",
        )

    email_clean = email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if user:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated",
            )
        if (not user.name or user.name == "User") and name:
            user.name = name.strip()
            db.commit()
            db.refresh(user)
    else:
        user_name = (name or email_clean.split("@")[0] or "Google User").strip()
        random_pwd = secrets.token_urlsafe(32)
        user = User(
            name=user_name,
            email=email_clean,
            password_hash=get_password_hash(random_pwd),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": "customer"},
        expires_delta=expires_delta,
    )

    return ApiResponse(
        success=True,
        data=AuthSuccessResponse(
            user=UserResponse.model_validate(user),
            token=TokenResponse(
                access_token=token,
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
        ),
        message="Google sign-in successful",
    )

@router.post("/logout", response_model=ApiResponse[dict])
def logout(current_user: User = Depends(get_current_user)):
    return ApiResponse(success=True, data={"message": "Logged out successfully"})

@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(success=True, data=UserResponse.model_validate(current_user))


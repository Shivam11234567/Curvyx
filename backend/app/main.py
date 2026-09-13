import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1.auth import router as auth_router
from app.api.v1.products import router as products_router
from app.api.v1.categories import router as categories_router
from app.api.v1.cart import router as cart_router
from app.api.v1.wishlist import router as wishlist_router
from app.api.v1.addresses import router as addresses_router
from app.api.v1.orders import router as orders_router
from app.api.v1.payments import router as payments_router
from app.api.v1.search import router as search_router
from app.api.v1.coupons import router as coupons_router
from app.api.v1.admin.auth import router as admin_auth_router
from app.api.v1.admin.dashboard import router as admin_dashboard_router
from app.api.v1.admin.products import router as admin_products_router
from app.api.v1.admin.categories import router as admin_categories_router
from app.api.v1.admin.inventory import router as admin_inventory_router
from app.api.v1.admin.orders import router as admin_orders_router
from app.api.v1.admin.customers import router as admin_customers_router
from app.api.v1.admin.coupons import router as admin_coupons_router
from app.api.v1.admin.homepage import router as admin_homepage_router
from app.api.v1.admin.reports import router as admin_reports_router
from app.api.v1.admin.system import router as admin_system_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="ELORA Innerwear API",
    description="Production-Grade Women's Innerwear Ecommerce Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = f"HTTP_{exc.status_code}"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail if isinstance(exc.detail, str) else "Error processing request",
            "code": code
        },
        headers=exc.headers
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        msg = err.get("msg", "Invalid value")
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "; ".join(errors),
            "code": "VALIDATION_ERROR"
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected server error occurred",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

@app.get("/ready", tags=["Health"])
def readiness_check():
    return {"status": "ready"}

app.include_router(auth_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(cart_router, prefix="/api/v1")
app.include_router(wishlist_router, prefix="/api/v1")
app.include_router(addresses_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(coupons_router, prefix="/api/v1")

app.include_router(admin_auth_router, prefix="/api/v1/admin")
app.include_router(admin_dashboard_router, prefix="/api/v1/admin")
app.include_router(admin_products_router, prefix="/api/v1/admin")
app.include_router(admin_categories_router, prefix="/api/v1/admin")
app.include_router(admin_inventory_router, prefix="/api/v1/admin")
app.include_router(admin_orders_router, prefix="/api/v1/admin")
app.include_router(admin_customers_router, prefix="/api/v1/admin")
app.include_router(admin_coupons_router, prefix="/api/v1/admin")
app.include_router(admin_homepage_router, prefix="/api/v1/admin")
app.include_router(admin_reports_router, prefix="/api/v1/admin")
app.include_router(admin_system_router, prefix="/api/v1/admin")

if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

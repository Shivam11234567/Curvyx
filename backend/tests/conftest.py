import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import get_password_hash
from app.models.admin_user import AdminUser
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.coupon import Coupon
from app.models.address import Address
from decimal import Decimal

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    admin = AdminUser(
        name="Admin Test",
        email="admintest@curvyx.com",
        password_hash=get_password_hash("AdminPass123"),
        role="admin",
        is_active=True
    )
    db.add(admin)

    user = User(
        name="Test Customer",
        email="testcust@example.com",
        password_hash=get_password_hash("CustPass123"),
        is_active=True
    )
    db.add(user)
    db.flush()

    addr = Address(
        user_id=user.id,
        name="Test Customer",
        phone="+919876543210",
        address_line_1="123 Test St",
        city="Mumbai",
        state="Maharashtra",
        postal_code="400001",
        country="India",
        is_default=True
    )
    db.add(addr)

    cat = Category(
        name="Test Bras",
        slug="test-bras",
        description="Category description",
        is_active=True
    )
    db.add(cat)
    db.flush()

    prod = Product(
        name="Test Everyday Bra",
        slug="test-everyday-bra",
        description="Everyday comfort bra",
        category_id=cat.id,
        mrp=Decimal("999.00"),
        selling_price=Decimal("799.00"),
        discount_percentage=Decimal("20.00"),
        is_active=True,
        is_featured=True
    )
    db.add(prod)
    db.flush()

    var1 = ProductVariant(
        product_id=prod.id,
        sku="TEST-34B-BLK",
        size="34B",
        color="Black",
        price=Decimal("799.00"),
        stock_quantity=10,
        is_active=True
    )
    var2 = ProductVariant(
        product_id=prod.id,
        sku="TEST-36B-BLK",
        size="36B",
        color="Black",
        price=Decimal("799.00"),
        stock_quantity=0,
        is_active=True
    )
    db.add(var1)
    db.add(var2)

    coupon = Coupon(
        code="TEST10",
        discount_type="PERCENTAGE",
        discount_value=Decimal("10.00"),
        minimum_order_value=Decimal("500.00"),
        is_active=True
    )
    db.add(coupon)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def customer_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "testcust@example.com",
        "password": "CustPass123"
    })
    return res.json()["data"]["token"]["access_token"]

@pytest.fixture
def admin_token(client):
    res = client.post("/api/v1/admin/auth/login", json={
        "email": "admintest@curvyx.com",
        "password": "AdminPass123"
    })
    return res.json()["data"]["token"]["access_token"]

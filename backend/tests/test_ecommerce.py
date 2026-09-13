from decimal import Decimal
from app.models.category import Category
from app.models.product_variant import ProductVariant
from app.models.address import Address

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_customer_register_and_login(client):
    reg_res = client.post("/api/v1/auth/register", json={
        "name": "New User",
        "email": "newuser@example.com",
        "password": "Password123"
    })
    assert reg_res.status_code == 201
    assert reg_res.json()["success"] is True
    assert "token" in reg_res.json()["data"]

    dup_res = client.post("/api/v1/auth/register", json={
        "name": "New User 2",
        "email": "newuser@example.com",
        "password": "Password123"
    })
    assert dup_res.status_code == 409

    login_res = client.post("/api/v1/auth/login", json={
        "email": "newuser@example.com",
        "password": "Password123"
    })
    assert login_res.status_code == 200
    assert login_res.json()["success"] is True

    bad_login = client.post("/api/v1/auth/login", json={
        "email": "newuser@example.com",
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401

def test_customer_cannot_access_admin_endpoints(client, customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}
    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 403

def test_admin_can_access_dashboard(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "total_revenue" in res.json()["data"]

def test_products_and_categories_endpoints(client):
    cat_res = client.get("/api/v1/categories")
    assert cat_res.status_code == 200
    assert len(cat_res.json()["data"]) > 0

    prod_res = client.get("/api/v1/products")
    assert prod_res.status_code == 200
    prods = prod_res.json()["data"]
    assert len(prods) > 0

    slug = prods[0]["slug"]
    detail_res = client.get(f"/api/v1/products/{slug}")
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["slug"] == slug

def test_cart_and_inventory_rules(client, customer_token, db_session):
    headers = {"Authorization": f"Bearer {customer_token}"}

    out_of_stock_var = db_session.query(ProductVariant).filter(ProductVariant.sku == "TEST-36B-BLK").first()
    in_stock_var = db_session.query(ProductVariant).filter(ProductVariant.sku == "TEST-34B-BLK").first()

    bad_add = client.post("/api/v1/cart/items", json={
        "product_variant_id": out_of_stock_var.id,
        "quantity": 1
    }, headers=headers)
    assert bad_add.status_code == 400

    over_add = client.post("/api/v1/cart/items", json={
        "product_variant_id": in_stock_var.id,
        "quantity": 50
    }, headers=headers)
    assert over_add.status_code == 400

    good_add = client.post("/api/v1/cart/items", json={
        "product_variant_id": in_stock_var.id,
        "quantity": 2
    }, headers=headers)
    assert good_add.status_code == 201
    assert good_add.json()["success"] is True

    cart_res = client.get("/api/v1/cart", headers=headers)
    assert cart_res.status_code == 200
    cart_data = cart_res.json()["data"]
    assert len(cart_data["items"]) > 0
    assert float(cart_data["subtotal"]) > 0

def test_checkout_and_payment_flow(client, customer_token, db_session):
    headers = {"Authorization": f"Bearer {customer_token}"}

    addr = db_session.query(Address).first()
    in_stock_var = db_session.query(ProductVariant).filter(ProductVariant.sku == "TEST-34B-BLK").first()
    initial_stock = in_stock_var.stock_quantity

    checkout_res = client.post("/api/v1/orders/checkout", json={
        "shipping_address_id": addr.id,
        "coupon_code": "TEST10"
    }, headers=headers)

    assert checkout_res.status_code == 201
    order_data = checkout_res.json()["data"]
    order_id = order_data["id"]
    assert float(order_data["discount"]) > 0
    assert order_data["payment_status"] == "PENDING"

    db_session.refresh(in_stock_var)
    assert in_stock_var.stock_quantity == initial_stock - 2

    verify_res = client.post("/api/v1/payments/verify", json={
        "order_id": order_id,
        "razorpay_order_id": order_data["razorpay_order_id"],
        "razorpay_payment_id": "pay_test_123456",
        "razorpay_signature": "mock_sig_valid"
    }, headers=headers)

    assert verify_res.status_code == 200
    assert verify_res.json()["success"] is True
    assert verify_res.json()["data"]["status"] == "PAID"

    get_order_res = client.get(f"/api/v1/orders/{order_id}", headers=headers)
    assert get_order_res.status_code == 200
    assert get_order_res.json()["data"]["payment_status"] == "PAID"
    assert get_order_res.json()["data"]["order_status"] == "CONFIRMED"

def test_admin_product_management(client, admin_token, db_session):
    headers = {"Authorization": f"Bearer {admin_token}"}
    cat = db_session.query(Category).first()

    create_prod_res = client.post("/api/v1/admin/products", json={
        "name": "Admin Added Luxe Bra",
        "category_id": cat.id,
        "mrp": 1299.00,
        "selling_price": 999.00,
        "is_active": True,
        "is_featured": False,
        "variants": [
            {
                "sku": "ADM-LUX-34C",
                "size": "34C",
                "color": "Ivory",
                "price": 999.00,
                "stock_quantity": 25,
                "is_active": True
            }
        ]
    }, headers=headers)

    assert create_prod_res.status_code == 201
    created_prod = create_prod_res.json()["data"]
    prod_id = created_prod["id"]

    inv_res = client.get("/api/v1/admin/inventory?search=ADM-LUX-34C", headers=headers)
    assert inv_res.status_code == 200
    items = inv_res.json()["data"]
    assert len(items) == 1
    assert items[0]["stock_quantity"] == 25

    var_id = items[0]["id"]
    patch_res = client.patch(f"/api/v1/admin/inventory/{var_id}", json={
        "stock_quantity": 30,
        "price": 949.00
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["stock_quantity"] == 30

def test_cod_checkout_and_admin_order_filtering(client, customer_token, admin_token, db_session):
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Add item to cart
    variant = db_session.query(ProductVariant).filter(ProductVariant.sku == "TEST-34B-BLK").first()
    client.post("/api/v1/cart/items", json={
        "product_variant_id": variant.id,
        "quantity": 1
    }, headers=cust_headers)

    addr = db_session.query(Address).first()

    # Checkout with COD
    cod_checkout_res = client.post("/api/v1/orders/checkout", json={
        "shipping_address_id": addr.id,
        "payment_method": "COD"
    }, headers=cust_headers)

    assert cod_checkout_res.status_code == 201
    cod_order = cod_checkout_res.json()["data"]
    assert cod_order["payment_method"] == "COD"
    assert cod_order["order_status"] == "CONFIRMED"
    assert cod_order["payment_status"] == "PENDING"
    assert cod_order["razorpay_order_id"].startswith("COD_")

    # Admin list all orders
    admin_orders_res = client.get("/api/v1/admin/orders", headers=admin_headers)
    assert admin_orders_res.status_code == 200
    orders_list = admin_orders_res.json()["data"]
    assert any(o["payment_method"] == "COD" for o in orders_list)

    # Admin filter by payment_method=COD
    admin_cod_res = client.get("/api/v1/admin/orders?payment_method=COD", headers=admin_headers)
    assert admin_cod_res.status_code == 200
    cod_list = admin_cod_res.json()["data"]
    assert len(cod_list) > 0
    assert all(o["payment_method"] == "COD" for o in cod_list)

    # Admin get single order detail
    detail_res = client.get(f"/api/v1/admin/orders/{cod_order['id']}", headers=admin_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()["data"]
    assert detail["payment_method"] == "COD"


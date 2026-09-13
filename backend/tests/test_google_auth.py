from unittest.mock import patch
from app.models.user import User

def test_google_auth_new_user(client, db_session):
    fake_token = "fake.google.id.token.new"
    fake_payload = {
        "email": "google_new@example.com",
        "name": "Google Newbie",
        "given_name": "Google",
        "family_name": "Newbie",
        "email_verified": True,
        "sub": "1234567890",
    }

    with patch("app.api.v1.auth.id_token.verify_oauth2_token", return_value=fake_payload):
        res = client.post("/api/v1/auth/google", json={"credential": fake_token})

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "google_new@example.com"
    assert data["data"]["user"]["name"] == "Google Newbie"
    assert "access_token" in data["data"]["token"]

    user = db_session.query(User).filter(User.email == "google_new@example.com").first()
    assert user is not None
    assert user.name == "Google Newbie"
    assert user.is_active is True

def test_google_auth_existing_user(client, db_session):
    fake_token = "fake.google.id.token.existing"
    fake_payload = {
        "email": "testcust@example.com",
        "name": "Test Customer",
        "email_verified": True,
        "sub": "9876543210",
    }

    with patch("app.api.v1.auth.id_token.verify_oauth2_token", return_value=fake_payload):
        res = client.post("/api/v1/auth/google", json={"credential": fake_token})

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "testcust@example.com"
    assert "access_token" in data["data"]["token"]

def test_google_auth_unverified_email(client):
    fake_token = "fake.google.id.token.unverified"
    fake_payload = {
        "email": "unverified@example.com",
        "name": "Unverified User",
        "email_verified": False,
        "sub": "11223344",
    }

    with patch("app.api.v1.auth.id_token.verify_oauth2_token", return_value=fake_payload):
        res = client.post("/api/v1/auth/google", json={"credential": fake_token})

    assert res.status_code == 400
    assert "not verified" in res.json()["message"].lower()

def test_google_auth_invalid_token(client):
    fake_token = "invalid.token"

    with patch("app.api.v1.auth.id_token.verify_oauth2_token", side_effect=ValueError("Token expired")):
        res = client.post("/api/v1/auth/google", json={"credential": fake_token})

    assert res.status_code == 401
    assert "invalid google token" in res.json()["message"].lower()

def test_google_auth_deactivated_user(client, db_session):
    inactive_user = User(
        name="Inactive User",
        email="inactive@example.com",
        password_hash="somehash",
        is_active=False
    )
    db_session.add(inactive_user)
    db_session.commit()

    fake_token = "fake.google.id.token.inactive"
    fake_payload = {
        "email": "inactive@example.com",
        "name": "Inactive User",
        "email_verified": True,
        "sub": "55667788",
    }

    with patch("app.api.v1.auth.id_token.verify_oauth2_token", return_value=fake_payload):
        res = client.post("/api/v1/auth/google", json={"credential": fake_token})

    assert res.status_code == 403
    assert "deactivated" in res.json()["message"].lower()

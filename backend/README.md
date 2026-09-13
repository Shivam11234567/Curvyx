# Curvyx - Python FastAPI Backend API

Production-grade RESTful API backend powering the Curvyx Women's Innerwear ecommerce platform, built using FastAPI, SQLAlchemy 2.x, PostgreSQL / SQLite (`DATABASE_URI`), Pydantic v2, JWT authentication, and Razorpay payment integration.

## Technology Stack
- **Framework**: FastAPI (Python 3.12+)
- **Server**: Uvicorn
- **ORM & Database**: SQLAlchemy 2.x + Alembic Migrations on PostgreSQL / SQLite
- **Security**: JWT tokens (Python-Jose) with native Bcrypt password hashing
- **Payments**: Razorpay SDK + HMAC-SHA256 signature verification
- **Validation**: Pydantic v2 with EmailValidator
- **Testing**: Pytest & Pytest-Asyncio

## Folder Structure
```
backend/
├── alembic/              # Database migration environments and revisions
├── app/
│   ├── api/v1/          # Customer & Admin REST endpoints
│   │   ├── admin/       # Protected admin API routes
│   │   ├── auth.py      # Customer registration, login & profile
│   │   ├── products.py  # Catalog listings & product details
│   │   ├── categories.py# Category hierarchy
│   │   ├── cart.py      # Cart calculations & mutations
│   │   ├── orders.py    # Order checkout & tracking
│   │   ├── payments.py  # Razorpay order generation & signature verification
│   │   └── wishlist.py  # Saved items management
│   ├── core/            # Configuration, security & dependency injectors
│   ├── db/              # SQLAlchemy engine, session & base
│   ├── models/          # SQLAlchemy database models
│   ├── schemas/         # Pydantic v2 request/response schemas
│   ├── services/        # Business logic (inventory deduction, storage, coupons)
│   └── main.py          # FastAPI application entrypoint with security headers
├── tests/               # Comprehensive pytest test suite
├── seed.py              # Initial realistic catalog seed script
├── requirements.txt
├── .env.example
└── README.md
```

## Environment Variables
Create a `.env` file in `backend/` following `.env.example`:
```env
DATABASE_URI=sqlite:///./ecommerce.db
JWT_SECRET_KEY=your-production-secret-key-at-least-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_placeholder_key_id
RAZORPAY_KEY_SECRET=rzp_test_placeholder_secret
RAZORPAY_WEBHOOK_SECRET=rzp_test_placeholder_webhook
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=ecommerce-assets
STORAGE_REGION=us-east-1
PORT=8000
ENVIRONMENT=development
```

## Installation & Running Locally
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Running Automated Tests
```bash
pytest tests -v
```

## Production Deployment
The backend includes:
- `/health` endpoint returning `{"status": "ok"}`
- Production CORS origin whitelisting (`CORS_ORIGINS`)
- HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`)
- Transactional integrity & atomic inventory deduction preventing negative stock
- Containerized or AWS EC2/ECS deployment ready

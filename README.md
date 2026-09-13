# Curvyx - Production-Grade Women's Innerwear Ecommerce Platform

A production-grade, secure, multi-tier ecommerce platform architected for the Curvyx women's innerwear brand.

```
                    INTERNET
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
  CUSTOMER WEBSITE            ADMIN DASHBOARD
   (Next.js / Vercel)       (React / Vite / Vercel)
         │                           │
         │  HTTPS REST API           │  HTTPS REST API
         └─────────────┬─────────────┘
                       ▼
             PYTHON FASTAPI BACKEND
             (AWS Hosting / Uvicorn)
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   SUPABASE / PG  OBJECT STORAGE  RAZORPAY
   (PostgreSQL)    (Product Imgs) (Payments)
```

## System Architecture & Folder Layout
- **`backend/`**: FastAPI (Python 3.12+), SQLAlchemy 2.x, Alembic migrations, PostgreSQL (`DATABASE_URI`), Pydantic v2, JWT authentication, native Bcrypt password hashing, Razorpay integration, Local/S3 storage service, and pytest test suite.
- **`frontend/`**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, TanStack Query, Lucide icons, responsive navigation, size guide charts, and Razorpay checkout modal.
- **`admin_dashboard/`**: React + Vite, TypeScript, Tailwind CSS, TanStack Query, Lucide icons, KPI dashboard, product variant matrix editor, image upload pipeline, stock controls, and order fulfillment workflows.

---

## Security & Architectural Highlights
1. **Centralized Backend Truth**: Frontend and Admin applications NEVER connect directly to PostgreSQL. Only the FastAPI backend accesses the database and secrets.
2. **Deterministic Amount Calculation**: Backend calculates tax, discounts, shipping, and total order amounts. Client amounts are never trusted.
3. **Atomic Inventory Protection**: Inventory is safely deducted inside database transactions to prevent negative stock.
4. **Historical Order Immutability**: All order items and shipping addresses are snapshotted at time of purchase.
5. **No Hardcoded Secrets**: All keys, ports, origins, and endpoints are driven through environment variables.
6. **No Code Comments**: Clean, modular, and self-explanatory architecture adhering strictly to development guidelines.

---

## Quickstart Guide

### 1. Backend Setup & Run
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
API Documentation available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Customer Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```
Customer Storefront accessible at: [http://localhost:3000](http://localhost:3000)

### 3. Admin Dashboard Setup & Run
```bash
cd admin_dashboard
npm install
npm run dev
```
Admin Portal accessible at: [http://localhost:5173](http://localhost:5173)
- **Admin Email**: `admin@curvyx.com`
- **Password**: `Admin@123456`

---

## Running Test Suites & Builds
- **Backend Tests**: `pytest backend/tests -v`
- **Frontend Build**: `npm run build` in `frontend/`
- **Admin Dashboard Build**: `npm run build` in `admin_dashboard/`

---

## Required Environment Variables

### Backend (`backend/.env`):
```env
DATABASE_URI=
JWT_SECRET_KEY=
JWT_ALGORITHM=
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=
CORS_ORIGINS=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_REGION=
PORT=
ENVIRONMENT=
```

### Customer Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

### Admin Dashboard (`admin_dashboard/.env`):
```env
VITE_API_URL=
```

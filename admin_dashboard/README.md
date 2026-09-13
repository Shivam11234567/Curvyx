# Curvyx - Admin Management Dashboard

Administrative operations portal for managing the women's innerwear ecommerce ecosystem, built with React, Vite, TypeScript, Tailwind CSS, and TanStack Query.

## Features
- **Executive KPI Dashboard**: Total revenue, orders, inventory stock warnings, and best-selling variants.
- **Product Management**: Create, edit, publish/unpublish products, upload photos via backend storage service, and manage multi-size/color variant matrices.
- **Category Hierarchy**: Category tree organization and banner artwork controls.
- **Inventory Control**: Live stock balances with in-place stock and price editing.
- **Order Fulfillment Pipeline**: Search, review address snapshots, and transition order stages (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`).
- **Promotions & Coupons**: Generate flat / percentage discount codes with expiration and redemption limits.
- **Customer CRM**: Buyer histories and lifetime spend summaries.
- **Operational Health**: System telemetry, database connection checks, and security audit log streams.

## Technology Stack
- React 18 + Vite
- TypeScript & Tailwind CSS
- React Router v6
- TanStack Query v5
- Lucide React Icons

## Environment Variables
Create `.env` in `admin_dashboard/`:
```env
VITE_API_URL=http://localhost:8000
```

## Running Locally
```bash
cd admin_dashboard
npm install
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173) to access the admin portal. Default admin credentials: `admin@curvyx.com` / `Admin@123456`.

## Production Build
```bash
npm run build
npm run preview
```
Deployment ready on Vercel, Netlify, or AWS S3 + CloudFront.

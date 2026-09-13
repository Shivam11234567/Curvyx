# Curvyx - Customer Storefront Frontend

Modern luxury women's innerwear ecommerce storefront built using Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, and Razorpay Checkout.

## Features
- **Modern Luxury Aesthetics**: High-end typography, curated palettes, fluid micro-interactions, responsive mobile menu.
- **Product Discovery & Category Catalog**: Filtering by size, color, price range, sorting, dynamic subcategory trees.
- **Product Detail Page**: Variant selection matrix (sizes/colors), dynamic stock checks, size guide fit chart modal, related styles.
- **Cart & Checkout Experience**: Real-time quantity manipulation, coupon discounts (`FIRST10`), automated tax and shipping calculations.
- **Razorpay Payment Integration**: Integrated checkout modal with backend HMAC-SHA256 signature verification.
- **Customer Account Suite**: User profile, saved delivery addresses, and detailed order tracking invoice pages.

## Technology Stack
- Next.js 14+ (App Router)
- TypeScript & Tailwind CSS
- TanStack Query v5 (Server State Management)
- Lucide React Icons
- Razorpay Web Checkout SDK

## Environment Variables
Create `.env.local` in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder_key_id
```

## Running Locally
```bash
cd frontend
npm install
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to view the storefront.

## Production Build
```bash
npm run build
npm run start
```
Deployment ready on Vercel or AWS Amplify.

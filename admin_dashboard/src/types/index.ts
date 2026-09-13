export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface AdminAuthResponse {
  admin: AdminUser;
  token: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  is_active: boolean;
  product_count?: number;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color: string;
  color_code?: string;
  price: number | string;
  stock_quantity: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  product_details?: string;
  material?: string;
  care_instructions?: string;
  category_id: string;
  category_name?: string;
  mrp: number | string;
  selling_price: number | string;
  discount_percentage: number | string;
  is_active: boolean;
  is_featured: boolean;
  primary_image?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  available_sizes: string[];
  available_colors: string[];
  total_stock: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  price: number | string;
  stock_quantity: number;
  is_active: boolean;
  status: string;
}

export interface OrderItem {
  id: string;
  product_variant_id?: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  size_snapshot: string;
  color_snapshot: string;
  image_url_snapshot?: string;
  unit_price: number | string;
  quantity: number;
  total_price: number | string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  subtotal: number | string;
  discount: number | string;
  shipping_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  payment_status: string;
  order_status: string;
  payment_method?: "COD" | "RAZORPAY" | string;
  shipping_address_snapshot: {
    name: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items_count?: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  orders_count: number;
  total_spent: number | string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number | string;
  minimum_order_value: number | string;
  maximum_discount?: number | string;
  usage_limit?: number;
  used_count: number;
  start_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_revenue: number | string;
  total_orders: number;
  pending_orders: number;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_customers: number;
  recent_orders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    payment_status: string;
    order_status: string;
    customer_name: string;
    created_at: string;
  }>;
  bestsellers: Array<{
    product_name: string;
    sku: string;
    total_sold: number;
    total_revenue: number;
  }>;
}

export interface SystemHealth {
  api_status: string;
  database_status: string;
  payment_service_status: string;
  storage_status: string;
  environment: string;
  timestamp: string;
}

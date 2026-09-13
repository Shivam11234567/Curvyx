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

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
}

export interface AuthResponse {
  user: User;
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
  price: string | number;
  stock_quantity: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  material?: string;
  category_id: string;
  category_name?: string;
  mrp: string | number;
  selling_price: string | number;
  discount_percentage: string | number;
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
  product_details?: string;
  care_instructions?: string;
  related_products?: Product[];
}

export interface CartItem {
  id: string;
  product_variant_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  sku: string;
  size: string;
  color: string;
  color_code?: string;
  image_url?: string;
  price: string | number;
  mrp: string | number;
  quantity: number;
  stock_quantity: number;
  total_price: string | number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string | number;
  discount: string | number;
  shipping_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  coupon_code?: string;
  total_items: number;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product: Product;
  created_at: string;
}

export interface Wishlist {
  id: string;
  items: WishlistItem[];
  total_items: number;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface OrderItem {
  id: string;
  product_variant_id?: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  size_snapshot: string;
  color_snapshot: string;
  image_url_snapshot?: string;
  unit_price: string | number;
  quantity: number;
  total_price: string | number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  subtotal: string | number;
  discount: string | number;
  shipping_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  payment_status: string;
  order_status: string;
  payment_method?: "COD" | "RAZORPAY" | string;
  shipping_address_snapshot: Address;
  items_count?: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

export interface CouponValidation {
  code: string;
  discount_amount: string | number;
  discount_type: string;
  discount_value: string | number;
}

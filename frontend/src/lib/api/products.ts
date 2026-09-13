import { apiClient } from "./client";
import { Product } from "@/types";

export interface ProductFilters {
  category_slug?: string;
  size?: string;
  color?: string;
  min_price?: number;
  max_price?: number;
  min_discount?: number;
  is_featured?: boolean;
  sort_by?: "featured" | "newest" | "price_asc" | "price_desc";
  page?: number;
  page_size?: number;
}

export const productsApi = {
  list: (filters: ProductFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.category_slug) params.append("category_slug", filters.category_slug);
    if (filters.size) params.append("size", filters.size);
    if (filters.color) params.append("color", filters.color);
    if (filters.min_price !== undefined) params.append("min_price", filters.min_price.toString());
    if (filters.max_price !== undefined) params.append("max_price", filters.max_price.toString());
    if (filters.min_discount !== undefined) params.append("min_discount", filters.min_discount.toString());
    if (filters.is_featured !== undefined) params.append("is_featured", filters.is_featured.toString());
    if (filters.sort_by) params.append("sort_by", filters.sort_by);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.page_size) params.append("page_size", filters.page_size.toString());

    const queryString = params.toString();
    return apiClient.get<Product[]>(`/api/v1/products${queryString ? `?${queryString}` : ""}`);
  },

  getBySlug: (slug: string) => apiClient.get<Product>(`/api/v1/products/${slug}`),

  search: (query: string, page: number = 1) =>
    apiClient.get<Product[]>(`/api/v1/search?q=${encodeURIComponent(query)}&page=${page}`),
};

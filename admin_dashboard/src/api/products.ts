import { adminApiClient } from "./client";
import { Product, ProductVariant, ProductImage } from "@/types";

export const adminProductsApi = {
  list: (params: { search?: string; category_id?: string; is_active?: boolean; page?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.search) sp.append("search", params.search);
    if (params.category_id) sp.append("category_id", params.category_id);
    if (params.is_active !== undefined) sp.append("is_active", params.is_active.toString());
    if (params.page) sp.append("page", params.page.toString());
    const query = sp.toString();
    return adminApiClient.get<Product[]>(`/api/v1/admin/products${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => adminApiClient.get<Product>(`/api/v1/admin/products/${id}`),

  create: (data: Partial<Product>) => adminApiClient.post<Product>("/api/v1/admin/products", data),

  update: (id: string, data: Partial<Product>) =>
    adminApiClient.put<Product>(`/api/v1/admin/products/${id}`, data),

  delete: (id: string) => adminApiClient.delete<{ message: string }>(`/api/v1/admin/products/${id}`),

  uploadImage: (productId: string, file: File, isPrimary: boolean = false) => {
    const formData = new FormData();
    formData.append("file", file);
    return adminApiClient.post<ProductImage>(
      `/api/v1/admin/products/${productId}/images?is_primary=${isPrimary}`,
      formData
    );
  },

  deleteImage: (imageId: string) =>
    adminApiClient.delete<{ message: string }>(`/api/v1/admin/products/images/${imageId}`),

  addVariant: (productId: string, variant: Partial<ProductVariant>) =>
    adminApiClient.post<ProductVariant>(`/api/v1/admin/products/${productId}/variants`, variant),

  updateVariant: (variantId: string, variant: Partial<ProductVariant>) =>
    adminApiClient.put<ProductVariant>(`/api/v1/admin/products/variants/${variantId}`, variant),

  deleteVariant: (variantId: string) =>
    adminApiClient.delete<{ message: string }>(`/api/v1/admin/products/variants/${variantId}`),
};

import { apiClient } from "./client";
import { Cart } from "@/types";

export const cartApi = {
  get: (couponCode?: string) =>
    apiClient.get<Cart>(`/api/v1/cart${couponCode ? `?coupon_code=${encodeURIComponent(couponCode)}` : ""}`),

  addItem: (productVariantId: string, quantity: number = 1) =>
    apiClient.post<Cart>("/api/v1/cart/items", {
      product_variant_id: productVariantId,
      quantity,
    }),

  updateItem: (itemId: string, quantity: number) =>
    apiClient.patch<Cart>(`/api/v1/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) =>
    apiClient.delete<Cart>(`/api/v1/cart/items/${itemId}`),
};

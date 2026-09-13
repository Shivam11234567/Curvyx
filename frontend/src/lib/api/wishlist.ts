import { apiClient } from "./client";
import { Wishlist } from "@/types";

export const wishlistApi = {
  get: () => apiClient.get<Wishlist>("/api/v1/wishlist"),
  add: (productId: string) => apiClient.post<Wishlist>("/api/v1/wishlist", { product_id: productId }),
  remove: (productId: string) => apiClient.delete<Wishlist>(`/api/v1/wishlist/${productId}`),
};

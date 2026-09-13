import { adminApiClient } from "./client";
import { InventoryItem } from "@/types";

export const adminInventoryApi = {
  list: (params: { status_filter?: string; search?: string; page?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.status_filter) sp.append("status_filter", params.status_filter);
    if (params.search) sp.append("search", params.search);
    if (params.page) sp.append("page", params.page.toString());
    const query = sp.toString();
    return adminApiClient.get<InventoryItem[]>(`/api/v1/admin/inventory${query ? `?${query}` : ""}`);
  },

  updateStock: (variantId: string, data: { stock_quantity: number; price?: number }) =>
    adminApiClient.patch<InventoryItem>(`/api/v1/admin/inventory/${variantId}`, data),
};

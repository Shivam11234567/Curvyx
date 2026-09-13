import { adminApiClient } from "./client";
import { Order } from "@/types";

export const adminOrdersApi = {
  list: (params: { search?: string; order_status?: string; payment_status?: string; payment_method?: string; page?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.search) sp.append("search", params.search);
    if (params.order_status) sp.append("order_status", params.order_status);
    if (params.payment_status) sp.append("payment_status", params.payment_status);
    if (params.payment_method) sp.append("payment_method", params.payment_method);
    if (params.page) sp.append("page", params.page.toString());
    const query = sp.toString();
    return adminApiClient.get<Order[]>(`/api/v1/admin/orders${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => adminApiClient.get<Order>(`/api/v1/admin/orders/${id}`),

  updateStatus: (id: string, data: { order_status?: string; payment_status?: string }) =>
    adminApiClient.patch<Order>(`/api/v1/admin/orders/${id}/status`, data),
};

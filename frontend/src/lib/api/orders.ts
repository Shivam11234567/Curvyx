import { apiClient } from "./client";
import { Order } from "@/types";

export const ordersApi = {
  checkout: (data: { shipping_address_id: string; coupon_code?: string; payment_method?: "RAZORPAY" | "COD" | string }) =>
    apiClient.post<Order>("/api/v1/orders/checkout", data),

  list: () => apiClient.get<Order[]>("/api/v1/orders"),

  getById: (id: string) => apiClient.get<Order>(`/api/v1/orders/${id}`),
};

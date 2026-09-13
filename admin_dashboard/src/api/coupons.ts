import { adminApiClient } from "./client";
import { Coupon } from "@/types";

export const adminCouponsApi = {
  list: (is_active?: boolean) => {
    const sp = new URLSearchParams();
    if (is_active !== undefined) sp.append("is_active", is_active.toString());
    const query = sp.toString();
    return adminApiClient.get<Coupon[]>(`/api/v1/admin/coupons${query ? `?${query}` : ""}`);
  },

  create: (data: Partial<Coupon>) => adminApiClient.post<Coupon>("/api/v1/admin/coupons", data),

  update: (id: string, data: Partial<Coupon>) =>
    adminApiClient.put<Coupon>(`/api/v1/admin/coupons/${id}`, data),

  delete: (id: string) => adminApiClient.delete<{ message: string }>(`/api/v1/admin/coupons/${id}`),
};

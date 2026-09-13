import { apiClient } from "./client";
import { CouponValidation } from "@/types";

export const couponsApi = {
  validate: (code: string, subtotal: number) =>
    apiClient.get<CouponValidation>(`/api/v1/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`),
};

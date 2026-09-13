import { apiClient } from "./client";

export interface CreatePaymentOrderResponse {
  order_id: string;
  order_number: string;
  razorpay_order_id: string;
  amount: string | number;
  currency: string;
  key_id: string;
}

export const paymentsApi = {
  createOrder: (orderId: string) =>
    apiClient.post<CreatePaymentOrderResponse>("/api/v1/payments/create-order", {
      order_id: orderId,
    }),

  verify: (data: {
    order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => apiClient.post<any>("/api/v1/payments/verify", data),
};

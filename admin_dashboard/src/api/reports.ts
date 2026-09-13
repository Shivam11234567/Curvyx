import { adminApiClient } from "./client";

export const adminReportsApi = {
  getReports: () =>
    adminApiClient.get<{
      total_revenue: number;
      total_orders: number;
      paid_orders: number;
      average_order_value: number;
      category_distribution: Array<{ category_name: string; product_count: number }>;
      order_status_breakdown: Record<string, number>;
    }>("/api/v1/admin/reports"),
};

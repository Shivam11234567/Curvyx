import { adminApiClient } from "./client";
import { DashboardMetrics } from "@/types";

export const adminDashboardApi = {
  getMetrics: () => adminApiClient.get<DashboardMetrics>("/api/v1/admin/dashboard"),
};

import { adminApiClient } from "./client";
import { AdminAuthResponse, AdminUser } from "@/types";

export const adminAuthApi = {
  login: (data: { email: string; password: string }) =>
    adminApiClient.post<AdminAuthResponse>("/api/v1/admin/auth/login", data),

  logout: () => adminApiClient.post<{ message: string }>("/api/v1/admin/auth/logout"),

  getProfile: () => adminApiClient.get<AdminUser>("/api/v1/admin/auth/me"),
};

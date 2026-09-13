import { apiClient } from "./client";
import { AuthResponse, User } from "@/types";

export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    apiClient.post<AuthResponse>("/api/v1/auth/register", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/api/v1/auth/login", data),

  logout: () => apiClient.post<{ message: string }>("/api/v1/auth/logout"),

  getProfile: () => apiClient.get<User>("/api/v1/auth/me"),
};

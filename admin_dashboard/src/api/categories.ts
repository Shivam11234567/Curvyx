import { adminApiClient } from "./client";
import { Category } from "@/types";

export const adminCategoriesApi = {
  list: () => adminApiClient.get<Category[]>("/api/v1/admin/categories"),
  create: (data: Partial<Category>) => adminApiClient.post<Category>("/api/v1/admin/categories", data),
  update: (id: string, data: Partial<Category>) =>
    adminApiClient.put<Category>(`/api/v1/admin/categories/${id}`, data),
  delete: (id: string) => adminApiClient.delete<{ message: string }>(`/api/v1/admin/categories/${id}`),
};

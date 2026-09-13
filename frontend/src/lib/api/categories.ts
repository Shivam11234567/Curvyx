import { apiClient } from "./client";
import { Category } from "@/types";

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/api/v1/categories"),
  getTree: () => apiClient.get<Category[]>("/api/v1/categories/tree"),
  getBySlug: (slug: string) => apiClient.get<Category>(`/api/v1/categories/${slug}`),
};

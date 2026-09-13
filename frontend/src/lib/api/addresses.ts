import { apiClient } from "./client";
import { Address } from "@/types";

export const addressesApi = {
  list: () => apiClient.get<Address[]>("/api/v1/addresses"),
  create: (data: Omit<Address, "id" | "user_id">) => apiClient.post<Address>("/api/v1/addresses", data),
  update: (id: string, data: Partial<Address>) => apiClient.put<Address>(`/api/v1/addresses/${id}`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/api/v1/addresses/${id}`),
};

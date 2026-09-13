import { adminApiClient } from "./client";
import { Customer } from "@/types";

export const adminCustomersApi = {
  list: (params: { search?: string; page?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.search) sp.append("search", params.search);
    if (params.page) sp.append("page", params.page.toString());
    const query = sp.toString();
    return adminApiClient.get<Customer[]>(`/api/v1/admin/customers${query ? `?${query}` : ""}`);
  },
};

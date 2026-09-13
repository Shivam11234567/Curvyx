import { adminApiClient } from "./client";
import { SystemHealth } from "@/types";

export const adminSystemApi = {
  getHealth: () => adminApiClient.get<SystemHealth>("/api/v1/admin/system/health"),

  getAuditLogs: (limit: number = 50) =>
    adminApiClient.get<Array<{
      id: string;
      admin_id: string;
      action: string;
      entity: string;
      entity_id?: string;
      details?: any;
      created_at: string;
    }>>(`/api/v1/admin/system/audit-logs?limit=${limit}`),
};

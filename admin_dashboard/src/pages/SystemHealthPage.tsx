import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminSystemApi } from "@/api/system";
import { Activity, Database, CreditCard, HardDrive, ShieldCheck, History } from "lucide-react";

export default function SystemHealthPage() {
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: () => adminSystemApi.getHealth(),
    refetchInterval: 15000,
  });

  const { data: auditLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => adminSystemApi.getAuditLogs(30),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Operational System Health
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live infrastructure telemetry, gateway connectivity, and security audit log history.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Backend API
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-base font-bold text-slate-900 uppercase">
                {health?.api_status || "Checking..."}
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Database Engine
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-base font-bold text-slate-900 uppercase">
                {health?.database_status || "Checking..."}
              </span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Razorpay Gateway
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-base font-bold text-slate-900 uppercase">
                {health?.payment_service_status || "Checking..."}
              </span>
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Object Storage
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-base font-bold text-slate-900 uppercase">
                {health?.storage_status || "Checking..."}
              </span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <History className="w-4 h-4 text-rose-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Security & Administrative Audit Trail
          </h2>
        </div>

        {isLogsLoading ? (
          <div className="text-center py-6 text-xs text-slate-400">Loading audit log stream...</div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Target Entity</th>
                  <th className="pb-3">Entity ID</th>
                  <th className="pb-3">Admin Subject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-slate-500">
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5">
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-800">{log.entity}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-500 truncate max-w-[150px]">
                      {log.entity_id || "—"}
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
                      {log.admin_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

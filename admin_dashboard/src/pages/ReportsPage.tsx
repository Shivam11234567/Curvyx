import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminReportsApi } from "@/api/reports";
import { formatCurrency } from "@/utils";
import { BarChart3, PieChart, TrendingUp, DollarSign } from "lucide-react";

export default function ReportsPage() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => adminReportsApi.getReports(),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading business analytics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Business Reports & Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Sales volume, average order values (AOV), and category distribution breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Paid Revenue
          </span>
          <p className="text-2xl font-bold text-slate-900 font-sans">
            {formatCurrency(reports?.total_revenue || 0)}
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Order Value (AOV)
          </span>
          <p className="text-2xl font-bold text-slate-900 font-sans">
            {formatCurrency(reports?.average_order_value || 0)}
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Orders Created
          </span>
          <p className="text-2xl font-bold text-slate-900">{reports?.total_orders || 0}</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Successful Paid Orders
          </span>
          <p className="text-2xl font-bold text-emerald-700">{reports?.paid_orders || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <PieChart className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Category Distribution
            </h2>
          </div>

          <div className="space-y-3">
            {reports?.category_distribution.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800">{cat.category_name}</span>
                <span className="font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  {cat.product_count} styles
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <BarChart3 className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Fulfillment Pipeline Volume
            </h2>
          </div>

          <div className="space-y-3">
            {reports?.order_status_breakdown &&
              Object.entries(reports.order_status_breakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-800 uppercase tracking-wider">{status}</span>
                  <span className="font-bold text-slate-900">{count} orders</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

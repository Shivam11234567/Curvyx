import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminDashboardApi } from "@/api/dashboard";
import { formatCurrency } from "@/utils";
import {
  IndianRupee,
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  Users,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: () => adminDashboardApi.getMetrics(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Sales Revenue",
      value: formatCurrency(metrics?.total_revenue || 0),
      icon: IndianRupee,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgLight: "bg-emerald-50",
    },
    {
      label: "Total Orders",
      value: metrics?.total_orders || 0,
      icon: ShoppingCart,
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgLight: "bg-blue-50",
    },
    {
      label: "Pending Orders",
      value: metrics?.pending_orders || 0,
      icon: Clock,
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgLight: "bg-amber-50",
    },
    {
      label: "Low / Out of Stock",
      value: `${metrics?.low_stock_count || 0} / ${metrics?.out_of_stock_count || 0}`,
      icon: AlertTriangle,
      color: "bg-rose-500",
      textColor: "text-rose-700",
      bgLight: "bg-rose-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Executive Overview
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics, revenue performance, and fulfillment health.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <p className="text-2xl font-bold text-slate-900 font-sans">{kpi.value}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${kpi.bgLight} ${kpi.textColor}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Orders
            </h2>
            <Link
              to="/orders"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 uppercase"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recent_orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-slate-900">
                      <Link to={`/orders/${ord.id}`} className="hover:text-rose-600">
                        {ord.order_number}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-700 font-medium">{ord.customer_name}</td>
                    <td className="py-3 font-bold text-slate-900 font-sans">
                      {formatCurrency(ord.total_amount)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.payment_status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ord.payment_status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.order_status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {ord.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Top Selling Variants
            </h2>
          </div>

          <div className="space-y-3">
            {metrics?.bestsellers && metrics.bestsellers.length > 0 ? (
              metrics.bestsellers.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="truncate max-w-[180px]">
                    <p className="font-bold text-slate-900 truncate">{item.product_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 font-sans block">
                      {item.total_sold} units
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatCurrency(item.total_revenue)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No sales history yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

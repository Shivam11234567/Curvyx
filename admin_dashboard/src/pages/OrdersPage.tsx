import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminOrdersApi } from "@/api/orders";
import { formatCurrency } from "@/utils";
import { Search, Eye, CreditCard, Banknote } from "lucide-react";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", search, orderStatus, paymentStatus, paymentMethod],
    queryFn: () =>
      adminOrdersApi.list({
        search: search || undefined,
        order_status: orderStatus || undefined,
        payment_status: paymentStatus || undefined,
        payment_method: paymentMethod || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Customer Orders
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review placed orders across COD and Razorpay payment channels, update fulfillment pipelines, and inspect address snapshots.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number (e.g. ELORA-2026...)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          aria-label="Payment Method"
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
        >
          <option value="">All Payment Methods</option>
          <option value="COD">Cash on Delivery (COD)</option>
          <option value="RAZORPAY">Razorpay (Online Gateway)</option>
        </select>

        <select
          value={orderStatus}
          onChange={(e) => setOrderStatus(e.target.value)}
          aria-label="Order Status"
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          aria-label="Payment Status"
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
        >
          <option value="">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading order registry...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No orders match the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Total (₹)</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Fulfillment</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const isCod = ord.payment_method === "COD" || ord.razorpay_order_id?.startsWith("COD_");
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-900">{ord.order_number}</td>
                      <td className="p-4 text-slate-500">
                        {new Date(ord.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">
                          {ord.shipping_address_snapshot?.name || "Guest Customer"}
                        </p>
                        <p className="text-[11px] text-slate-400">{ord.shipping_address_snapshot?.city}</p>
                      </td>
                      <td className="p-4">
                        {isCod ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Banknote className="w-3 h-3 text-amber-600" />
                            <span>COD</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <CreditCard className="w-3 h-3 text-indigo-600" />
                            <span>Razorpay</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-900 font-sans">
                        {formatCurrency(ord.total_amount)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.payment_status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.order_status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.order_status === "CONFIRMED" || ord.order_status === "PROCESSING"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { useAuth } from "@/features/auth/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Package, ArrowRight, Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react";

export default function OrdersListPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list(),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">Sign in to View Your Orders</h1>
        <button
          onClick={() => router.push("/login?redirect=/account/orders")}
          className="px-8 py-3 bg-rose-600 text-white rounded-full text-xs font-semibold uppercase tracking-wider"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/4 mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-neutral-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-rose-100 pb-6">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">My Orders</h1>
        <p className="text-xs text-neutral-500 mt-1">Track current shipments and view previous orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-rose-100 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-xl font-bold text-neutral-800">No Orders Yet</h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            You haven't placed any orders with us yet. Discover your next favorite bra today.
          </p>
          <Link
            href="/category/bras"
            className="inline-block px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-rose-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-rose-200 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-neutral-900">
                    {ord.order_number}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ord.order_status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : ord.order_status === "CONFIRMED" || ord.order_status === "PROCESSING"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ord.order_status}
                  </span>
                </div>

                <p className="text-xs text-neutral-500">
                  Placed on {new Date(ord.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {ord.items_count} items
                </p>

                <p className="text-xs font-semibold text-neutral-700">
                  Payment:{" "}
                  <span
                    className={
                      ord.payment_status === "PAID"
                        ? "text-emerald-600 font-bold"
                        : "text-amber-600 font-bold"
                    }
                  >
                    {ord.payment_status}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-rose-50">
                <span className="text-base font-bold text-neutral-900 font-sans">
                  {formatCurrency(ord.total_amount)}
                </span>

                <Link
                  href={`/account/orders/${ord.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-full uppercase tracking-wider transition-colors"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

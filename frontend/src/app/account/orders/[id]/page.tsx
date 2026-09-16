"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { useAuth } from "@/features/auth/AuthContext";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Banknote,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Loader2,
} from "lucide-react";

function OrderDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const isJustConfirmed = searchParams.get("success") === "true";
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace(`/login?redirect=/account/orders/${orderId}`);
    }
  }, [user, isAuthLoading, router, orderId]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!user && !!orderId,
  });

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
          Verifying session...
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-1/3" />
        <div className="h-64 bg-neutral-200 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-neutral-800">Order Not Found</h2>
        <Link
          href="/account/orders"
          className="inline-block px-6 py-2 bg-rose-600 text-white rounded-full text-xs font-semibold uppercase"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  const address = order.shipping_address_snapshot || {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Orders</span>
        </Link>
      </div>

      {isJustConfirmed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-emerald-950">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
            Your payment was verified and order <strong>{order.order_number}</strong> is confirmed. A tracking email has been dispatched.
          </p>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-rose-100">
          <div>
            <span className="text-[11px] font-bold text-rose-600 tracking-widest uppercase block mb-1">
              Order Details
            </span>
            <h2 className="font-mono text-xl font-bold text-neutral-900">
              #{order.order_number}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.order_status === "DELIVERED"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.order_status === "CONFIRMED" || order.order_status === "PROCESSING"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
            >
              Order: {order.order_status}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.payment_status === "PAID"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
                }`}
            >
              Payment: {order.payment_status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <MapPin className="w-4 h-4" />
              <h3 className="font-serif text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Shipping Destination
              </h3>
            </div>
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-700 space-y-1 leading-relaxed">
              <p className="font-bold text-neutral-900">{address.name}</p>
              <p>{address.phone}</p>
              <p>
                {address.address_line_1}
                {address.address_line_2 && `, ${address.address_line_2}`}
              </p>
              <p>
                {address.city}, {address.state} - {address.postal_code}
              </p>
              <p className="text-neutral-500 font-medium">{address.country}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              {order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_") ? (
                <Banknote className="w-4 h-4 text-amber-600" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <h3 className="font-serif text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Payment Information
              </h3>
            </div>
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-700 space-y-1.5">
              <p className="flex justify-between items-center">
                <span className="text-neutral-500">Method:</span>
                {order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_") ? (
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Cash on Delivery (COD)
                  </span>
                ) : (
                  <span className="font-semibold text-neutral-900">
                    Razorpay Online Gateway
                  </span>
                )}
              </p>
              {order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_") ? (
                <p className="text-[11px] text-neutral-500 pt-1">
                  Pay {formatCurrency(order.total_amount)} via cash or UPI to the delivery courier upon arrival.
                </p>
              ) : (
                <>
                  {order.razorpay_order_id && (
                    <p className="flex justify-between font-mono text-[11px]">
                      <span className="text-neutral-500">Gateway Order:</span>
                      <span>{order.razorpay_order_id}</span>
                    </p>
                  )}
                  {order.razorpay_payment_id && (
                    <p className="flex justify-between font-mono text-[11px]">
                      <span className="text-neutral-500">Payment Ref:</span>
                      <span className="text-emerald-700 font-bold">{order.razorpay_payment_id}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-serif text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4 pb-2 border-b border-rose-100">
            Purchased Items
          </h3>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-neutral-50/70 rounded-2xl border border-neutral-200/80 gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-16 rounded-xl overflow-hidden bg-rose-50 flex-shrink-0">
                    <img
                      src={item.image_url_snapshot || "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=200"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-neutral-900">
                      {item.product_name_snapshot}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Size: <strong>{item.size_snapshot}</strong> | Color:{" "}
                      <strong>{item.color_snapshot}</strong> | SKU: {item.sku_snapshot}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-neutral-900 font-sans">
                  {formatCurrency(item.total_price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-rose-100 pt-6 space-y-2 text-xs text-neutral-600 max-w-sm ml-auto">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-neutral-900 font-sans">
              {formatCurrency(order.subtotal)}
            </span>
          </div>

          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount</span>
              <span className="font-sans">- {formatCurrency(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-semibold text-neutral-900 font-sans">
              {Number(order.shipping_amount) === 0 ? "FREE" : formatCurrency(order.shipping_amount)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Tax (GST 5%)</span>
            <span className="font-semibold text-neutral-900 font-sans">
              {formatCurrency(order.tax_amount)}
            </span>
          </div>

          <div className="pt-3 border-t border-rose-100 flex justify-between text-base font-bold text-neutral-900 font-sans">
            <span>Total Paid</span>
            <span className="text-rose-700">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading order summary...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}

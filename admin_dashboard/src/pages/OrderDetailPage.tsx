import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminOrdersApi } from "@/api/orders";
import { formatCurrency } from "@/utils";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  Package,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => adminOrdersApi.getById(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (order) {
      setOrderStatus(order.order_status);
      setPaymentStatus(order.payment_status);
    }
  }, [order]);

  const updateStatusMutation = useMutation({
    mutationFn: (data: { order_status?: string; payment_status?: string }) =>
      adminOrdersApi.updateStatus(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      alert("Order status updated successfully!");
    },
    onError: (err: any) => alert(err.message || "Failed to update order status"),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-xs text-slate-500">Order not found.</div>;
  }

  const address = order.shipping_address_snapshot || {};

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Order Details</span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              #{order.order_number}
            </h1>
          </div>
        </div>

        <div className="text-right text-xs text-slate-500">
          Placed on {new Date(order.created_at).toLocaleString("en-IN")}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Update Order Status & Payment State
          </h2>
          {order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_") ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
              <Banknote className="w-3.5 h-3.5 text-amber-600" />
              COD: Admin Controls Payment (Pending ↔ Paid)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              Razorpay: Gateway-Driven Payment Verification
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
              Fulfillment Status
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              aria-label="Order Status"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
              Payment Status
            </label>
            {order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_") ? (
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                aria-label="Payment Status"
                className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="PENDING">PENDING (Cash Not Collected)</option>
                <option value="PAID">PAID (Cash Collected)</option>
                <option value="FAILED">FAILED (Refused/Returned)</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            ) : (
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                  order.payment_status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {order.payment_status}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Automated by Razorpay</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const isCod = order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_");
              updateStatusMutation.mutate({
                order_status: orderStatus,
                payment_status: isCod ? paymentStatus : undefined,
              });
            }}
            disabled={updateStatusMutation.isPending}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Status Updates</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-600">
            <MapPin className="w-4 h-4" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Shipping Address Snapshot
            </h3>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">{address.name}</p>
            <p>{address.phone}</p>
            <p>
              {address.address_line_1}
              {address.address_line_2 && `, ${address.address_line_2}`}
            </p>
            <p>
              {address.city}, {address.state} - {address.postal_code}
            </p>
            <p className="text-slate-400 font-medium">{address.country}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-600">
            {order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_") ? (
              <Banknote className="w-4 h-4 text-amber-600" />
            ) : (
              <CreditCard className="w-4 h-4 text-indigo-600" />
            )}
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Payment & Gateway Records
            </h3>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Method:</span>
              {order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_") ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                  <Banknote className="w-3 h-3 text-amber-700" />
                  Cash on Delivery (COD)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900">
                  <CreditCard className="w-3 h-3 text-indigo-700" />
                  Razorpay Online Gateway
                </span>
              )}
            </div>

            {order.payment_method === "COD" || order.razorpay_order_id?.startsWith("COD_") ? (
              <>
                <p className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">COD Reference:</span>
                  <span className="font-semibold text-slate-800">{order.razorpay_order_id || `COD_${order.order_number}`}</span>
                </p>
                <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200/60 text-[11px] text-amber-900 mt-1">
                  <strong>Cash Collection:</strong> Payment of {formatCurrency(order.total_amount)} will be collected at customer's doorstep upon delivery.
                </div>
              </>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gateway:</span>
                    <span className="font-bold text-indigo-900">Razorpay API Gateway</span>
                  </div>

                  {order.razorpay_order_id && (
                    <div className="flex items-center justify-between font-mono text-[11px] pt-1.5 border-t border-indigo-100/60">
                      <span className="text-slate-500">Razorpay Order ID:</span>
                      <span className="font-bold text-slate-800 select-all bg-white px-2 py-0.5 rounded border border-slate-200">
                        {order.razorpay_order_id}
                      </span>
                    </div>
                  )}

                  {order.razorpay_payment_id && (
                    <div className="flex items-center justify-between font-mono text-[11px] pt-1.5 border-t border-indigo-100/60">
                      <span className="text-slate-500">Razorpay Payment ID:</span>
                      <span className="font-bold text-emerald-700 select-all bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {order.razorpay_payment_id}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-indigo-100/60">
                    <span className="text-slate-500">Verification:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      HMAC SHA-256 Verified
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
          Purchased Item Snapshots ({order.items?.length || 0})
        </h3>

        <div className="space-y-3">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.image_url_snapshot || "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=100"}
                  alt=""
                  className="w-12 h-14 rounded-lg object-cover bg-white"
                />
                <div>
                  <p className="font-bold text-slate-900">{item.product_name_snapshot}</p>
                  <p className="text-[11px] text-slate-500">
                    Size: <strong>{item.size_snapshot}</strong> | Color:{" "}
                    <strong>{item.color_snapshot}</strong> | SKU: {item.sku_snapshot}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                </div>
              </div>

              <span className="font-bold text-slate-900 font-sans text-sm">
                {formatCurrency(item.total_price)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-1.5 text-xs text-slate-600 max-w-xs ml-auto">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900 font-sans">
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
            <span className="font-semibold text-slate-900 font-sans">
              {Number(order.shipping_amount) === 0 ? "FREE" : formatCurrency(order.shipping_amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span className="font-semibold text-slate-900 font-sans">
              {formatCurrency(order.tax_amount)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900 font-sans">
            <span>Total</span>
            <span className="text-rose-700">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

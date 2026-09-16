"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/lib/api/cart";
import { useAuth } from "@/features/auth/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, Trash2, ArrowRight, Tag, ShieldCheck, Loader2 } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const [couponInput, setCouponInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart", appliedCoupon],
    queryFn: () => cartApi.get(appliedCoupon || undefined),
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError(null);
    setAppliedCoupon(couponInput.trim().toUpperCase());
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
          Loading bag...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-neutral-900">Sign in to View Your Cart</h1>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
          Please sign in to access your saved bag and checkout seamlessly.
        </p>
        <Link
          href="/login?redirect=/cart"
          className="inline-block px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-md transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/4 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-neutral-200 rounded-2xl" />
            ))}
          </div>
          <div className="lg:col-span-4 h-64 bg-neutral-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Your Bag is Empty</h1>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
          Explore our collection of cloud-soft everyday bras, modal briefs, and luxury loungewear.
        </p>
        <div className="pt-2">
          <Link
            href="/category/bras"
            className="inline-block px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="font-serif text-3xl font-bold text-neutral-900">
        Shopping Bag ({cart?.total_items || items.length} {items.length === 1 ? "Item" : "Items"})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-rose-100 shadow-sm gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-24 rounded-xl overflow-hidden bg-rose-50/40 border border-rose-100 flex-shrink-0">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=200"}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <Link
                    href={`/product/${item.product_slug}`}
                    className="font-serif text-sm sm:text-base font-bold text-neutral-900 hover:text-rose-600 transition-colors line-clamp-1"
                  >
                    {item.product_name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    Size: <strong className="text-neutral-800">{item.size}</strong> | Color:{" "}
                    <strong className="text-neutral-800">{item.color}</strong>
                  </p>
                  <p className="text-[11px] text-neutral-400">SKU: {item.sku}</p>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-sm font-bold text-neutral-900 font-sans">
                      {formatCurrency(item.price)}
                    </span>
                    {Number(item.mrp) > Number(item.price) && (
                      <span className="text-xs text-neutral-400 line-through">
                        {formatCurrency(item.mrp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-50">
                <div className="flex items-center border border-neutral-200 rounded-xl bg-white px-2 py-0.5">
                  <button
                    onClick={() =>
                      updateQuantityMutation.mutate({
                        itemId: item.id,
                        quantity: Math.max(1, item.quantity - 1),
                      })
                    }
                    disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                    className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-rose-600 font-bold"
                  >
                    -
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-neutral-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantityMutation.mutate({
                        itemId: item.id,
                        quantity: item.quantity + 1,
                      })
                    }
                    disabled={item.quantity >= item.stock_quantity || updateQuantityMutation.isPending}
                    className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-rose-600 font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-neutral-900 font-sans block">
                    {formatCurrency(item.total_price)}
                  </span>
                  <button
                    onClick={() => removeItemMutation.mutate(item.id)}
                    className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-neutral-900 pb-3 border-b border-rose-100">
              Order Summary
            </h3>

            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="e.g. FIRST10"
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  Apply
                </button>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon <strong>{appliedCoupon}</strong> active</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-neutral-500 hover:text-red-600 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </form>

            <div className="space-y-2.5 pt-2 border-t border-rose-50 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Bag Subtotal</span>
                <span className="font-semibold text-neutral-900 font-sans">
                  {formatCurrency(cart?.subtotal || 0)}
                </span>
              </div>

              {Number(cart?.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span className="font-sans">- {formatCurrency(cart?.discount || 0)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-neutral-900 font-sans">
                  {Number(cart?.shipping_amount || 0) === 0 ? (
                    <span className="text-emerald-600 uppercase font-bold">FREE</span>
                  ) : (
                    formatCurrency(cart?.shipping_amount || 0)
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Tax (GST 5%)</span>
                <span className="font-semibold text-neutral-900 font-sans">
                  {formatCurrency(cart?.tax_amount || 0)}
                </span>
              </div>

              <div className="pt-3 border-t border-rose-100 flex justify-between text-base font-bold text-neutral-900 font-sans">
                <span>Final Total</span>
                <span className="text-rose-700">{formatCurrency(cart?.total_amount || 0)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg hover:shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Safe & Secure 256-bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

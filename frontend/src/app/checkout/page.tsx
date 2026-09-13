"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/lib/api/cart";
import { addressesApi } from "@/lib/api/addresses";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import { useAuth } from "@/features/auth/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Address } from "@/types";
import { ShieldCheck, Plus, CheckCircle2, Lock, ArrowRight, Loader2, CreditCard, Banknote } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("COD");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: true,
  });

  const { data: cart, isLoading: isCartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.get(),
    enabled: !!user,
  });

  const { data: addresses = [], isLoading: isAddressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressesApi.list(),
    enabled: !!user,
  });

  React.useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const addAddressMutation = useMutation({
    mutationFn: (data: typeof newAddress) => addressesApi.create(data),
    onSuccess: (newAddr) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelectedAddressId(newAddr.id);
      setIsAddingNewAddress(false);
      setNewAddress({
        name: "",
        phone: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: true,
      });
    },
  });

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.name || !newAddress.phone || !newAddress.address_line_1 || !newAddress.city || !newAddress.postal_code) {
      alert("Please fill all required address fields");
      return;
    }
    addAddressMutation.mutate(newAddress);
  };

  const handlePlaceOrderAndPay = async () => {
    if (!selectedAddressId) {
      setCheckoutError("Please select a delivery address.");
      return;
    }
    setCheckoutError(null);
    setIsProcessingPayment(true);

    try {
      if (paymentMethod === "COD") {
        const order = await ordersApi.checkout({
          shipping_address_id: selectedAddressId,
          coupon_code: cart?.coupon_code || undefined,
          payment_method: "COD",
        });

        queryClient.invalidateQueries({ queryKey: ["cart"] });
        router.push(`/account/orders/${order.id}?success=true&cod=true`);
        return;
      }

      // Online Razorpay Payment Flow
      const order = await ordersApi.checkout({
        shipping_address_id: selectedAddressId,
        coupon_code: cart?.coupon_code || undefined,
        payment_method: "RAZORPAY",
      });

      const paymentOrder = await paymentsApi.createOrder(order.id);

      if (typeof window !== "undefined" && window.Razorpay && !paymentOrder.key_id.startsWith("rzp_test_placeholder")) {
        const options = {
          key: paymentOrder.key_id,
          amount: Number(paymentOrder.amount) * 100,
          currency: paymentOrder.currency,
          name: "Curvyx",
          description: `Order #${order.order_number}`,
          order_id: paymentOrder.razorpay_order_id,
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone,
          },
          theme: {
            color: "#e11d48",
          },
          handler: async (response: any) => {
            try {
              await paymentsApi.verify({
                order_id: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              queryClient.invalidateQueries({ queryKey: ["cart"] });
              router.push(`/account/orders/${order.id}?success=true`);
            } catch (err: any) {
              setCheckoutError(err.message || "Payment verification failed");
              setIsProcessingPayment(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        await paymentsApi.verify({
          order_id: order.id,
          razorpay_order_id: paymentOrder.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        router.push(`/account/orders/${order.id}?success=true`);
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Could not process order checkout");
      setIsProcessingPayment(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">Sign in to Checkout</h1>
        <button
          onClick={() => router.push("/login?redirect=/checkout")}
          className="px-8 py-3 bg-rose-600 text-white rounded-full text-xs font-semibold uppercase tracking-wider"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (isCartLoading || isAddressesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/4 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-neutral-200 rounded-2xl" />
          <div className="lg:col-span-5 h-80 bg-neutral-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-rose-100 pb-6">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Secure Checkout</h1>
        <p className="text-xs text-neutral-500 mt-1">Review shipping details & complete payment</p>
      </div>

      {checkoutError && (
        <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200">
          {checkoutError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h2 className="font-serif text-lg font-bold text-neutral-900">
                1. Delivery Address
              </h2>
              {!isAddingNewAddress && (
                <button
                  onClick={() => setIsAddingNewAddress(true)}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 uppercase"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              )}
            </div>

            {isAddingNewAddress ? (
              <form onSubmit={handleCreateAddress} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">
                    Flat / House / Building / Street *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.address_line_1}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line_1: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">
                    Area / Landmark
                  </label>
                  <input
                    type="text"
                    value={newAddress.address_line_2}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line_2: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addAddressMutation.isPending}
                    className="px-6 py-2 bg-rose-600 text-white text-xs font-semibold uppercase rounded-full"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-neutral-500">No saved addresses found.</p>
                <button
                  onClick={() => setIsAddingNewAddress(true)}
                  className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold uppercase rounded-full"
                >
                  Add Delivery Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? "border-rose-600 bg-rose-50/40 ring-2 ring-rose-100"
                        : "border-neutral-200 bg-white hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold text-neutral-900">{addr.name}</p>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">{addr.phone}</p>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {addr.address_line_1}
                      {addr.address_line_2 && `, ${addr.address_line_2}`}, {addr.city},{" "}
                      {addr.state} - {addr.postal_code}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-neutral-900 pb-3 border-b border-rose-100">
              2. Select Payment Method
            </h2>
            <div className="space-y-3">
              {/* Cash On Delivery (COD) - Active */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  paymentMethod === "COD"
                    ? "border-rose-600 bg-rose-50/40 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-rose-100 text-rose-600 rounded-lg">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-neutral-900">Cash on Delivery (COD)</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        Available
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Pay with cash or UPI directly at your doorstep upon order delivery.
                    </p>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="w-5 h-5 rounded-full border-2 border-rose-600 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  </div>
                </div>
              </div>

              {/* Razorpay Online Payment - Disabled / Future Feature */}
              <div className="p-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 opacity-75 cursor-not-allowed flex items-start justify-between gap-3 select-none">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-neutral-200 text-neutral-500 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-neutral-600">
                        Online Payment (Cards, UPI, NetBanking)
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-200 text-neutral-600">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Razorpay gateway integration is temporarily disabled and will be enabled in upcoming releases.
                    </p>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="w-5 h-5 rounded-full border-2 border-neutral-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-neutral-900 pb-3 border-b border-rose-100">
              Order Items ({cart?.total_items || 0})
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.image_url || "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=100"}
                      alt=""
                      className="w-10 h-12 rounded-lg object-cover bg-rose-50 flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-neutral-800 line-clamp-1">{item.product_name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {item.size} • {item.color} (x{item.quantity})
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900 font-sans">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-rose-100 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900 font-sans">
                  {formatCurrency(cart?.subtotal || 0)}
                </span>
              </div>

              {Number(cart?.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({cart?.coupon_code})</span>
                  <span className="font-sans">- {formatCurrency(cart?.discount || 0)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-neutral-900 font-sans">
                  {Number(cart?.shipping_amount || 0) === 0 ? "FREE" : formatCurrency(cart?.shipping_amount || 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Tax (GST 5%)</span>
                <span className="font-semibold text-neutral-900 font-sans">
                  {formatCurrency(cart?.tax_amount || 0)}
                </span>
              </div>

              <div className="pt-3 border-t border-rose-100 flex justify-between text-base font-bold text-neutral-900 font-sans">
                <span>Total Amount</span>
                <span className="text-rose-700">{formatCurrency(cart?.total_amount || 0)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrderAndPay}
              disabled={isProcessingPayment || !selectedAddressId}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg hover:shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === "COD"
                      ? `Place COD Order • ${formatCurrency(cart?.total_amount || 0)}`
                      : `Pay ${formatCurrency(cart?.total_amount || 0)}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>
                {paymentMethod === "COD"
                  ? "Safe & Verified Cash on Delivery"
                  : "100% Protected & Verified Payment"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

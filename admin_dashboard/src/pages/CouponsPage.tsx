import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCouponsApi } from "@/api/coupons";
import { Plus, Trash2, Tag, CheckCircle } from "lucide-react";

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "PERCENTAGE",
    discount_value: "10",
    minimum_order_value: "499",
    maximum_discount: "300",
    usage_limit: "500",
    is_active: true,
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => adminCouponsApi.list(),
  });

  const createCouponMutation = useMutation({
    mutationFn: (data: any) =>
      adminCouponsApi.create({
        ...data,
        discount_value: Number(data.discount_value),
        minimum_order_value: Number(data.minimum_order_value),
        maximum_discount: data.maximum_discount ? Number(data.maximum_discount) : undefined,
        usage_limit: data.usage_limit ? Number(data.usage_limit) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setFormData({
        code: "",
        discount_type: "PERCENTAGE",
        discount_value: "10",
        minimum_order_value: "499",
        maximum_discount: "300",
        usage_limit: "500",
        is_active: true,
      });
      alert("Coupon created successfully!");
    },
    onError: (err: any) => alert(err.message || "Failed to create coupon"),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => adminCouponsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value) return;
    createCouponMutation.mutate(formData);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Promotion & Coupon Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure cart discounts, usage limits, and minimum checkout thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Tag className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Create Coupon
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. LUXE20"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Type
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  aria-label="Discount Type"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="PERCENTAGE">PERCENTAGE (%)</option>
                  <option value="FLAT">FLAT (₹)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Value *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Min Cart (₹)
                </label>
                <input
                  type="number"
                  value={formData.minimum_order_value}
                  onChange={(e) =>
                    setFormData({ ...formData, minimum_order_value: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Max Cap (₹)
                </label>
                <input
                  type="number"
                  value={formData.maximum_discount}
                  onChange={(e) => setFormData({ ...formData, maximum_discount: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Usage Limit (Total Redemptions)
              </label>
              <input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={createCouponMutation.isPending}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors"
            >
              Generate Coupon
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading coupon vouchers...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Min Order</th>
                    <th className="p-4">Usage</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-900">{c.code}</td>
                      <td className="p-4 font-bold text-rose-600">
                        {c.discount_type === "PERCENTAGE"
                          ? `${c.discount_value}% OFF`
                          : `₹${c.discount_value} FLAT`}
                      </td>
                      <td className="p-4 font-medium text-slate-700">₹{c.minimum_order_value}</td>
                      <td className="p-4 text-slate-600">
                        {c.used_count} / {c.usage_limit || "∞"} used
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {c.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Delete coupon "${c.code}"?`)) {
                              deleteCouponMutation.mutate(c.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

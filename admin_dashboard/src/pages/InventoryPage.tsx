import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminInventoryApi } from "@/api/inventory";
import { formatCurrency } from "@/utils";
import { Search, AlertTriangle, Check, Save } from "lucide-react";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editValues, setEditValues] = useState<Record<string, { stock: number; price: number }>>({});

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["admin-inventory", search, statusFilter],
    queryFn: () =>
      adminInventoryApi.list({
        search: search || undefined,
        status_filter: statusFilter || undefined,
      }),
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ variantId, stock, price }: { variantId: string; stock: number; price?: number }) =>
      adminInventoryApi.updateStock(variantId, { stock_quantity: stock, price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-metrics"] });
      alert("Inventory updated successfully!");
    },
    onError: (err: any) => alert(err.message || "Failed to update inventory"),
  });

  const handleFieldChange = (variantId: string, field: "stock" | "price", value: number) => {
    setEditValues((prev) => ({
      ...prev,
      [variantId]: {
        stock: field === "stock" ? value : prev[variantId]?.stock ?? 0,
        price: field === "price" ? value : prev[variantId]?.price ?? 0,
      },
    }));
  };

  const handleSaveRow = (item: any) => {
    const currentEdit = editValues[item.id];
    const newStock = currentEdit?.stock !== undefined ? currentEdit.stock : item.stock_quantity;
    const newPrice = currentEdit?.price !== undefined ? currentEdit.price : Number(item.price);
    updateStockMutation.mutate({ variantId: item.id, stock: newStock, price: newPrice });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Inventory Control
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time SKU level stock balances, pricing adjustments, and low-stock alerts.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, product name, size, or color..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              statusFilter === "" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("low_stock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              statusFilter === "low_stock"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            Low Stock (≤10)
          </button>
          <button
            onClick={() => setStatusFilter("out_of_stock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              statusFilter === "out_of_stock"
                ? "bg-red-600 text-white"
                : "bg-red-50 text-red-800 border border-red-200 hover:bg-red-100"
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading inventory records...</div>
        ) : inventory.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No inventory records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Size & Color</th>
                  <th className="p-4">Selling Price (₹)</th>
                  <th className="p-4">Stock Units</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const currentEdit = editValues[item.id];
                  const stockVal = currentEdit?.stock !== undefined ? currentEdit.stock : item.stock_quantity;
                  const priceVal = currentEdit?.price !== undefined ? currentEdit.price : Number(item.price);
                  const isModified =
                    (currentEdit?.stock !== undefined && currentEdit.stock !== item.stock_quantity) ||
                    (currentEdit?.price !== undefined && currentEdit.price !== Number(item.price));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-900">{item.sku}</td>
                      <td className="p-4 font-bold text-slate-800">{item.product_name}</td>
                      <td className="p-4">
                        <span className="font-semibold">{item.size}</span> •{" "}
                        <span className="text-slate-500">{item.color}</span>
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          value={priceVal}
                          onChange={(e) => handleFieldChange(item.id, "price", Number(e.target.value))}
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-sans font-bold"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          min="0"
                          value={stockVal}
                          onChange={(e) => handleFieldChange(item.id, "stock", Number(e.target.value))}
                          className={`w-20 px-2 py-1 bg-white border rounded-lg text-xs font-bold ${
                            stockVal === 0
                              ? "border-red-400 text-red-700 bg-red-50/50"
                              : stockVal <= 10
                              ? "border-amber-400 text-amber-700 bg-amber-50/50"
                              : "border-slate-200"
                          }`}
                        />
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === "OUT_OF_STOCK"
                              ? "bg-red-100 text-red-800"
                              : item.status === "LOW_STOCK"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleSaveRow(item)}
                          disabled={!isModified || updateStockMutation.isPending}
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 ml-auto ${
                            isModified
                              ? "bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
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

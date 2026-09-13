import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminProductsApi } from "@/api/products";
import { adminCategoriesApi } from "@/api/categories";
import { formatCurrency } from "@/utils";
import { Plus, Search, Edit3, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products", search, selectedCategory],
    queryFn: () =>
      adminProductsApi.list({
        search: search || undefined,
        category_id: selectedCategory || undefined,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminCategoriesApi.list(),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => adminProductsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminProductsApi.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProductMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage styles, images, price points, and active storefront visibility.
          </p>
        </div>
        <Link
          to="/products/new"
          className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-rose-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or slug..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No products match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Pricing (Selling / MRP)</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={p.primary_image || "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=100"}
                        alt=""
                        className="w-10 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                      />
                      <div>
                        <Link
                          to={`/products/${p.id}`}
                          className="font-bold text-slate-900 hover:text-rose-600 block line-clamp-1"
                        >
                          {p.name}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">{p.slug}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{p.category_name || "—"}</td>
                    <td className="p-4 font-bold text-slate-900 font-sans">
                      {formatCurrency(p.selling_price)}
                      <span className="text-slate-400 font-normal line-through ml-1.5 text-[11px]">
                        {formatCurrency(p.mrp)}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {p.total_stock}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({p.variants.length} vars)
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({ id: p.id, is_active: !p.is_active })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {p.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{p.is_active ? "Published" : "Draft"}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/products/${p.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

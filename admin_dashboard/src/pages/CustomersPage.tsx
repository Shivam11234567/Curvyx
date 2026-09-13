import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminCustomersApi } from "@/api/customers";
import { formatCurrency } from "@/utils";
import { Search, UserCheck, Mail, Phone } from "lucide-react";

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers", search],
    queryFn: () => adminCustomersApi.list({ search: search || undefined }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Customer Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Registered buyer accounts, cumulative spend, and order history.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading customer profiles...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Orders Placed</th>
                  <th className="p-4">Lifetime Spend</th>
                  <th className="p-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-800">{c.orders_count} orders</td>
                    <td className="p-4 font-bold text-slate-900 font-sans">
                      {formatCurrency(c.total_spent)}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
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

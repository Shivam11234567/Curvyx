import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  Users,
  Ticket,
  BarChart3,
  Activity,
  LogOut,
  Menu,
  X,
  Store,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/products", label: "Products & Variants", icon: Package },
  { path: "/categories", label: "Categories", icon: Layers },
  { path: "/inventory", label: "Inventory Stock", icon: Boxes },
  { path: "/orders", label: "Orders", icon: ShoppingCart },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/coupons", label: "Coupons & Discounts", icon: Ticket },
  { path: "/reports", label: "Analytics & Reports", icon: BarChart3 },
  { path: "/system", label: "Operational Health", icon: Activity },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-white text-sm">
              E
            </div>
            <div>
              <span className="font-bold tracking-wider text-white uppercase text-sm block">
                ELORA Admin
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">Control Center</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-3 py-2 bg-slate-800/60 rounded-xl flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{admin?.name}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase">{admin?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Store:</span>
            <span className="font-semibold text-slate-800">Elora Innerwear Online</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2" />
            <span className="text-emerald-700 font-bold">API Live</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Customer Storefront</span>
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

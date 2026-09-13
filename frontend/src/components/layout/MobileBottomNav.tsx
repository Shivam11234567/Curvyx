"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cartApi } from "@/lib/api/cart";
import { wishlistApi } from "@/lib/api/wishlist";
import { categoriesApi } from "@/lib/api/categories";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Home,
  Grid,
  Search,
  Heart,
  ShoppingBag,
  User as UserIcon,
  X,
  ChevronRight,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.get(),
    enabled: !!user,
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get(),
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: () => categoriesApi.getTree(),
  });

  const cartItemCount = cart?.total_items || 0;
  const wishlistItemCount = wishlist?.total_items || 0;

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Category Bottom Sheet / Drawer on Mobile */}
      {isCategoryDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsCategoryDrawerOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto z-10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-900">Explore Collections</h3>
                <p className="text-xs text-neutral-500">Find your perfect fit & style</p>
              </div>
              <button
                onClick={() => setIsCategoryDrawerOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-rose-50"
                aria-label="Close categories drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {categories.map((cat) => (
                <div key={cat.id} className="border border-rose-100/80 rounded-2xl p-4 bg-rose-50/20 hover:bg-rose-50/50 transition-colors">
                  <Link
                    href={`/category/${cat.slug}`}
                    onClick={() => setIsCategoryDrawerOpen(false)}
                    className="flex items-center justify-between font-serif font-bold text-neutral-900 hover:text-rose-600 text-sm"
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </Link>

                  {cat.children && cat.children.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-rose-100/60">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${sub.slug}`}
                          onClick={() => setIsCategoryDrawerOpen(false)}
                          className="text-xs px-3 py-1 bg-white border border-rose-200/60 rounded-full text-neutral-700 hover:text-rose-600 hover:border-rose-300"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-rose-100/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-2"
      >
        <div className="flex items-center justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              isActive("/") ? "text-rose-600 font-bold" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          <button
            onClick={() => setIsCategoryDrawerOpen(!isCategoryDrawerOpen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              isCategoryDrawerOpen || pathname.startsWith("/category")
                ? "text-rose-600 font-bold"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Shop</span>
          </button>

          <Link
            href="/search"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              isActive("/search") ? "text-rose-600 font-bold" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Search</span>
          </Link>

          <Link
            href="/wishlist"
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              isActive("/wishlist") ? "text-rose-600 font-bold" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Heart className="w-5 h-5" />
            {wishlistItemCount > 0 && (
              <span className="absolute top-0 right-2 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {wishlistItemCount}
              </span>
            )}
            <span className="text-[10px] tracking-tight">Wishlist</span>
          </Link>

          <Link
            href="/cart"
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              isActive("/cart") ? "text-rose-600 font-bold" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-2 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
            <span className="text-[10px] tracking-tight">Bag</span>
          </Link>

          <Link
            href={user ? "/account" : "/login"}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              isActive("/account") || isActive("/login")
                ? "text-rose-600 font-bold"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{user ? "Account" : "Login"}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

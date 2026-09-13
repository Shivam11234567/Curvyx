"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { cartApi } from "@/lib/api/cart";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
} from "lucide-react";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: () => categoriesApi.getTree(),
  });

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-700 hover:text-rose-600 rounded-md"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/" className="flex flex-col">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-neutral-900 uppercase">
                ELORA
              </span>
              <span className="text-[9px] tracking-[0.3em] font-sans text-rose-600 font-semibold uppercase -mt-1">
                Lingerie & Essentials
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium tracking-wider text-neutral-700 hover:text-rose-600 uppercase transition-colors"
            >
              Home
            </Link>
            {categories.slice(0, 5).map((cat) => (
              <div key={cat.id} className="relative group">
                <Link
                  href={`/category/${cat.slug}`}
                  className="flex items-center gap-1 text-sm font-medium tracking-wider text-neutral-700 group-hover:text-rose-600 uppercase transition-colors py-6"
                >
                  {cat.name}
                  {cat.children && cat.children.length > 0 && (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-rose-600 transition-transform group-hover:rotate-180" />
                  )}
                </Link>

                {cat.children && cat.children.length > 0 && (
                  <div className="absolute top-full left-0 w-64 bg-white border border-rose-100 rounded-b-xl shadow-xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-1 mb-2 border-b border-rose-50 text-xs font-semibold text-rose-900 tracking-wider uppercase">
                      All {cat.name}
                    </div>
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${sub.slug}`}
                        className="block px-4 py-2 text-sm text-neutral-600 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2.5 text-neutral-700 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
              aria-label="Search Catalog"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/wishlist"
              className="relative p-2.5 text-neutral-700 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist && wishlist.total_items > 0 && (
                <span className="absolute 1 top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.total_items}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative p-2.5 text-neutral-700 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart && cart.total_items > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.total_items}
                </span>
              )}
            </Link>

            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-3 border border-rose-200 rounded-full text-neutral-800 hover:border-rose-400 transition-colors"
                  >
                    <span className="text-xs font-medium max-w-[100px] truncate">
                      {user.name.split(" ")[0]}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white border border-rose-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-rose-50">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{user.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile & Addresses
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wider text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors uppercase"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div className="border-t border-rose-100 bg-rose-50/50 py-4 px-4 sm:px-6 transition-all">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bras, panties, modal sleepwear, shapewear..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-rose-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-full shadow-sm transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-2 text-neutral-500 hover:text-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-rose-100 bg-white py-4 px-6 space-y-3 shadow-xl">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-neutral-800 hover:text-rose-600 uppercase"
          >
            Home
          </Link>
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <Link
                href={`/category/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-neutral-800 hover:text-rose-600 uppercase"
              >
                {cat.name}
              </Link>
              {cat.children && (
                <div className="pl-4 space-y-1 border-l-2 border-rose-100">
                  {cat.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/category/${sub.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-xs text-neutral-600 hover:text-rose-600 py-1"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

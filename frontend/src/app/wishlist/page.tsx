"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/features/auth/AuthContext";
import ProductCard from "@/components/product/ProductCard";
import { Heart, ShoppingBag } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get(),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-neutral-900">Sign in to View Your Wishlist</h1>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
          Keep track of your favorite bra styles and loungewear pieces.
        </p>
        <button
          onClick={() => router.push("/login?redirect=/wishlist")}
          className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-md transition-colors"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = wishlist?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-rose-100 pb-6">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">
          My Wishlist ({items.length} {items.length === 1 ? "Style" : "Styles"})
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Saved pieces ready for your wardrobe</p>
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-rose-100 p-8">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-neutral-900">Your Wishlist is Empty</h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
            Save the styles you love while browsing to purchase later.
          </p>
          <div className="pt-2">
            <Link
              href="/category/bras"
              className="inline-block px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition-colors"
            >
              Discover Bestsellers
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} isWishlisted={true} />
          ))}
        </div>
      )}
    </div>
  );
}

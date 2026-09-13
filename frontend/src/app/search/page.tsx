"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/features/auth/AuthContext";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";
import { Search } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { user } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => productsApi.search(query),
    enabled: query.length > 0,
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get(),
    enabled: !!user,
  });

  const wishlistedIds = new Set(wishlist?.items?.map((item) => item.product_id) || []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-rose-100 pb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
          Search Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {products.length} {products.length === 1 ? "style" : "styles"} found
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-200 rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-xl font-bold text-neutral-800">
            No exact matches found
          </h2>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Try checking for typos, using broader terms, or exploring our popular collections.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              href="/category/bras"
              className="px-6 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-full uppercase"
            >
              Browse Bras
            </Link>
            <Link
              href="/category/panties"
              className="px-6 py-2.5 bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-full uppercase hover:bg-neutral-200"
            >
              Browse Panties
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistedIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center">Loading search results...</div>}>
      <SearchContent />
    </Suspense>
  );
}

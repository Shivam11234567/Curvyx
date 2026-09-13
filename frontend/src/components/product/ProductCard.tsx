"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/features/auth/AuthContext";
import { Heart, Sparkles } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
}

export default function ProductCard({ product, isWishlisted = false }: ProductCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.add(product.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const removeWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.remove(product.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (isWishlisted) {
      removeWishlistMutation.mutate();
    } else {
      addWishlistMutation.mutate();
    }
  };

  const discountVal = Number(product.discount_percentage);

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-rose-50/80 hover:border-rose-200 hover:shadow-xl transition-all duration-300">
      <Link href={`/product/${product.slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-rose-50/30">
        <img
          src={product.primary_image || "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=600&auto=format&fit=crop&q=80"}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-1.5 z-10">
          {discountVal > 0 && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm">
              {discountVal}% OFF
            </span>
          )}
          {product.is_featured && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-900/90 text-amber-200 text-[9px] sm:text-[10px] font-semibold tracking-wider rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm">
              <Sparkles className="w-2.5 h-2.5" />
              <span className="hidden xs:inline sm:inline">BESTSELLER</span>
              <span className="inline xs:hidden sm:hidden">HOT</span>
            </span>
          )}
        </div>

        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            isWishlisted
              ? "bg-rose-600 text-white shadow-md"
              : "bg-white/80 text-neutral-600 hover:text-rose-600 hover:bg-white shadow-sm"
          }`}
          aria-label="Add to Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {product.available_sizes.length > 0 && (
          <div className="absolute bottom-2 inset-x-2 bg-white/90 backdrop-blur-sm py-1 px-2 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
            <span className="text-[11px] font-medium text-neutral-700">
              Sizes: {product.available_sizes.slice(0, 4).join(", ")}
              {product.available_sizes.length > 4 ? " +" : ""}
            </span>
          </div>
        )}
      </Link>

      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.category_name && (
            <p className="text-[10px] sm:text-[11px] font-semibold text-rose-600 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
              {product.category_name}
            </p>
          )}

          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          {product.material && (
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 line-clamp-1 hidden xs:block">{product.material}</p>
          )}
        </div>

        <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-3 border-t border-rose-50 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-bold text-neutral-900 font-sans">
              {formatCurrency(product.selling_price)}
            </span>
            {Number(product.mrp) > Number(product.selling_price) && (
              <span className="text-[11px] sm:text-xs text-neutral-400 line-through hidden sm:inline">
                {formatCurrency(product.mrp)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {product.variants.slice(0, 3).map((v) => (
              <div
                key={v.id}
                title={v.color}
                className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-neutral-300 shadow-inner"
                style={{ backgroundColor: v.color_code || "#111827" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

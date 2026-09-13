"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/features/auth/AuthContext";
import ProductCard from "@/components/product/ProductCard";
import { SlidersHorizontal, ArrowUpDown, X, RotateCcw } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [priceRange, setPriceRange] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "newest" | "price_asc" | "price_desc">("featured");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);

  let min_price: number | undefined = undefined;
  let max_price: number | undefined = undefined;
  if (priceRange === "under-700") {
    max_price = 700;
  } else if (priceRange === "700-1200") {
    min_price = 700;
    max_price = 1200;
  } else if (priceRange === "above-1200") {
    min_price = 1200;
  }

  const { data: category, isLoading: isCategoryLoading, isError: isCategoryError } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => categoriesApi.getBySlug(slug),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", slug, selectedSize, selectedColor, min_price, max_price, sortBy],
    queryFn: () =>
      productsApi.list({
        category_slug: slug,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        min_price: min_price,
        max_price: max_price,
        sort_by: sortBy,
      }),
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get(),
    enabled: !!user,
  });

  const wishlistedIds = new Set(wishlist?.items?.map((item) => item.product_id) || []);

  const sizeOptions = ["32B", "34B", "36B", "36C", "S", "M", "L", "XL"];
  const colorOptions = [
    { name: "Black", code: "#111827", label: "Midnight Black" },
    { name: "Nude", code: "#d4b996", label: "Warm Nude" },
    { name: "Rose", code: "#f43f5e", label: "Blush Rose" },
    { name: "White", code: "#ffffff", label: "Pure White" },
    { name: "Navy", code: "#1e3a8a", label: "Midnight Navy" },
    { name: "Wine", code: "#881337", label: "Mulberry Wine" },
    { name: "Emerald", code: "#064e3b", label: "Emerald Green" },
    { name: "Olive", code: "#556b2f", label: "Sage Olive" },
  ];

  const priceOptions = [
    { label: "All Prices", value: "" },
    { label: "Under ₹700", value: "under-700" },
    { label: "₹700 - ₹1,200", value: "700-1200" },
    { label: "Above ₹1,200", value: "above-1200" },
  ];

  const activeFilterCount = [selectedSize, selectedColor, priceRange].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedSize("");
    setSelectedColor("");
    setPriceRange("");
  };

  if (!isCategoryLoading && (isCategoryError || !category)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-sm">
          <SlidersHorizontal className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-widest text-rose-600 uppercase">Collection Notice</span>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">Collection Currently Unavailable</h1>
          <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
            This collection is currently hidden or undergoing curation. Please browse our active luxury lingerie collections below.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Link
            href="/category/bras"
            className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold uppercase rounded-full tracking-wider hover:bg-rose-700 transition-colors shadow-sm"
          >
            Bras & Bralettes
          </Link>
          <Link
            href="/category/panties"
            className="px-5 py-2.5 bg-white border border-rose-200 text-neutral-800 text-xs font-bold uppercase rounded-full tracking-wider hover:bg-rose-50 transition-colors"
          >
            Panties & Thongs
          </Link>
          <Link
            href="/category/lingerie-sets"
            className="px-5 py-2.5 bg-white border border-rose-200 text-neutral-800 text-xs font-bold uppercase rounded-full tracking-wider hover:bg-rose-50 transition-colors"
          >
            Lingerie Sets
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase rounded-full tracking-wider hover:bg-neutral-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Category Header */}
      <div className="border-b border-rose-100 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-rose-600 uppercase">Collection</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 capitalize mt-1">
            {category?.name || slug.replace(/-/g, " ")}
          </h1>
          {category?.description && (
            <p className="mt-2 text-sm text-neutral-600 max-w-3xl leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
        <p className="text-xs font-medium text-neutral-500 whitespace-nowrap">
          Showing <span className="font-bold text-neutral-900">{products.length}</span> luxury styles
        </p>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rose-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              isFilterOpen
                ? "bg-rose-50 border-rose-300 text-rose-900 shadow-sm"
                : "border-rose-200 text-neutral-800 hover:bg-rose-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All ({activeFilterCount})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-neutral-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort products"
            className="text-xs font-semibold bg-white border border-rose-200 rounded-full px-4 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase tracking-wider cursor-pointer hover:border-rose-300 transition-colors"
          >
            <option value="featured">Sort: Featured</option>
            <option value="newest">Sort: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Filter Expandable Panel */}
      {isFilterOpen && (
        <div className="p-6 bg-rose-50/40 rounded-3xl border border-rose-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Size Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Size
              </h4>
              {selectedSize && (
                <button
                  onClick={() => setSelectedSize("")}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(selectedSize === sz ? "" : sz)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedSize === sz
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm scale-105"
                      : "bg-white text-neutral-700 border-rose-200/80 hover:border-rose-400 hover:bg-white"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Color
              </h4>
              {selectedColor && (
                <button
                  onClick={() => setSelectedColor("")}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((clr) => {
                const isSelected = selectedColor === clr.name;
                return (
                  <button
                    key={clr.name}
                    onClick={() => setSelectedColor(isSelected ? "" : clr.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm scale-105"
                        : "bg-white text-neutral-700 border-rose-200/80 hover:border-rose-400 hover:bg-white"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: clr.code }}
                    />
                    <span>{clr.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Price Range
              </h4>
              {priceRange && (
                <button
                  onClick={() => setPriceRange("")}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriceRange(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    priceRange === opt.value
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm scale-105"
                      : "bg-white text-neutral-700 border-rose-200/80 hover:border-rose-400 hover:bg-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-neutral-500 font-medium">Active filters:</span>
          {selectedSize && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-rose-200 text-neutral-800 rounded-full text-xs font-semibold">
              Size: {selectedSize}
              <button onClick={() => setSelectedSize("")} aria-label="Remove size filter">
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
              </button>
            </span>
          )}
          {selectedColor && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-rose-200 text-neutral-800 rounded-full text-xs font-semibold">
              Color: {selectedColor}
              <button onClick={() => setSelectedColor("")} aria-label="Remove color filter">
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
              </button>
            </span>
          )}
          {priceRange && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-rose-200 text-neutral-800 rounded-full text-xs font-semibold">
              Price: {priceOptions.find((p) => p.value === priceRange)?.label}
              <button onClick={() => setPriceRange("")} aria-label="Remove price filter">
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 rounded-2xl sm:rounded-3xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 sm:py-20 text-center space-y-4 bg-rose-50/20 rounded-3xl border border-dashed border-rose-200 p-6 sm:p-8">
          <p className="font-serif text-xl sm:text-2xl font-bold text-neutral-800">No styles match these filters</p>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Try resetting your active filters to view all available sizes, colors, and prices in this collection.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2.5 bg-rose-600 text-white text-xs font-bold uppercase rounded-full tracking-wider hover:bg-rose-700 transition-colors shadow-sm"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
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

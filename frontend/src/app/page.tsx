"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/features/auth/AuthContext";
import ProductCard from "@/components/product/ProductCard";
import { Sparkles, ArrowRight, ShieldCheck, Feather, Heart, Star } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  const { data: featuredProducts = [], isLoading: isFeaturedLoading } = useQuery({
    queryKey: ["products-featured"],
    queryFn: () => productsApi.list({ is_featured: true, page_size: 8 }),
  });

  const { data: newArrivals = [], isLoading: isNewArrivalsLoading } = useQuery({
    queryKey: ["products-new"],
    queryFn: () => productsApi.list({ sort_by: "newest", page_size: 4 }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => categoriesApi.list(),
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get(),
    enabled: !!user,
  });

  const wishlistedIds = new Set(wishlist?.items?.map((item) => item.product_id) || []);

  return (
    <div className="space-y-12 sm:space-y-16 md:space-y-24 pb-16 sm:pb-20">
      <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[680px] flex items-center bg-gradient-to-r from-rose-950 via-neutral-900 to-rose-950 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=1600&auto=format&fit=crop&q=80"
            alt="Elora Luxury Innerwear"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-2xl space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[11px] sm:text-xs font-semibold tracking-widest uppercase backdrop-blur-md">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Sensual Luxury & Seductive Comfort
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.15] sm:leading-[1.1]">
              Embrace Your Sensual Allure.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-neutral-300 font-light leading-relaxed max-w-xl">
              Discover French eyelash lace bralettes, seductive plunge push-ups, liquid silk chemises, and cheeky Brazilian thongs crafted to celebrate your every curve.
            </p>

            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/category/bras"
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm tracking-wider uppercase rounded-full shadow-lg hover:shadow-rose-600/30 transition-all flex items-center justify-center gap-2 text-center"
              >
                <span>Shop Bras & Bralettes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/category/lingerie-sets"
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm tracking-wider uppercase rounded-full backdrop-blur-md border border-white/20 transition-all text-center"
              >
                Lingerie Sets & Babydolls
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-10">
          <h2 className="text-[11px] sm:text-xs font-bold text-rose-600 tracking-[0.2em] uppercase mb-1.5 sm:mb-2">
            Curated Categories
          </h2>
          <p className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900">
            Find Your Everyday Favorite
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-5 lg:gap-6">
          {categories.filter((c) => !c.parent_id).slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center p-3 sm:p-4 bg-white rounded-2xl border border-rose-50 hover:border-rose-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 sm:mb-4 bg-rose-50/50 p-1 border-2 border-rose-100 group-hover:border-rose-500 transition-colors">
                <img
                  src={cat.image_url || "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=400&auto=format&fit=crop&q=80"}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="font-serif text-xs sm:text-sm md:text-base font-bold text-neutral-900 group-hover:text-rose-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5">
                {cat.product_count !== undefined ? `${cat.product_count} Styles` : "Explore"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase mb-1">
              Customer Obsessions
            </h2>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
              Bestselling Styles
            </p>
          </div>
          <Link
            href="/category/bras"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 uppercase tracking-wider group"
          >
            <span>View All Bestsellers</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isFeaturedLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-neutral-200 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistedIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="bg-gradient-to-br from-rose-950 via-rose-900 to-neutral-950 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative z-10">
          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="p-2.5 sm:p-3 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-400/20 shrink-0">
              <Feather className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base sm:text-lg font-bold text-white">Weightless Feel</h3>
              <p className="text-[11px] sm:text-xs text-neutral-300 leading-relaxed">
                Made with silky-soft micro-modal and combed cotton that breathes effortlessly against delicate skin.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="p-2.5 sm:p-3 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-400/20 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base sm:text-lg font-bold text-white">Zero Wire, 100% Lift</h3>
              <p className="text-[11px] sm:text-xs text-neutral-300 leading-relaxed">
                Anatomically contoured molded cups provide natural lift without metal wires that poke or pinch.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm sm:col-span-2 md:col-span-1">
            <div className="p-2.5 sm:p-3 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-400/20 shrink-0">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base sm:text-lg font-bold text-white">Discreet & Seamless</h3>
              <p className="text-[11px] sm:text-xs text-neutral-300 leading-relaxed">
                Laser-cut bonded edges that disappear completely under fitted t-shirts, tops, and bodycon dresses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h2 className="text-[11px] sm:text-xs font-bold text-rose-600 tracking-[0.2em] uppercase mb-1">
              Just Landed
            </h2>
            <p className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900">
              Fresh New Arrivals
            </p>
          </div>
          <Link
            href="/category/sleepwear"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 uppercase tracking-wider group"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isNewArrivalsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-neutral-200 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistedIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 rounded-3xl p-6 sm:p-10 md:p-12 border border-rose-200/60 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3 sm:space-y-4 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 bg-rose-600 text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase rounded-full">
              Limited Offer
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 leading-snug">
              Enjoy 10% Off Your First Purchase
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600">
              Use code <strong className="text-rose-700 font-bold">FIRST10</strong> at checkout on all wire-free bras, modal underwear packs, and sleepwear.
            </p>
          </div>
          <Link
            href="/category/bras"
            className="w-full sm:w-auto text-center px-8 py-3.5 sm:py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-widest uppercase rounded-full shadow-lg transition-colors whitespace-nowrap"
          >
            Claim Your Discount
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-[11px] sm:text-xs font-bold text-rose-600 tracking-[0.2em] uppercase mb-1.5 sm:mb-2">
            Reviews
          </h2>
          <p className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900">
            Loved by Over 50,000+ Women
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3 sm:space-y-4">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 italic leading-relaxed">
              "The CloudSoft Wire-Free bra is a revelation. I have worn underwires for 12 years and always hated the marks. This bra gives me the exact same lift with zero pain."
            </p>
            <div className="pt-2 border-t border-rose-50 flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-900">Ananya R.</span>
              <span className="text-neutral-500 text-[11px]">Verified Buyer, Mumbai</span>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3 sm:space-y-4">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 italic leading-relaxed">
              "The modal bikini panties are softer than anything I've purchased from expensive global brands. No lines under my gym leggings either!"
            </p>
            <div className="pt-2 border-t border-rose-50 flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-900">Dr. Meera K.</span>
              <span className="text-neutral-500 text-[11px]">Verified Buyer, Bengaluru</span>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3 sm:space-y-4">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 italic leading-relaxed">
              "Ordered the sleep set and everyday t-shirt bra. Superb packaging, ultra-fast delivery, and true to size! Ordering another 3 pack right away."
            </p>
            <div className="pt-2 border-t border-rose-50 flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-900">Sneha P.</span>
              <span className="text-neutral-500 text-[11px]">Verified Buyer, Delhi</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { cartApi } from "@/lib/api/cart";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/features/auth/AuthContext";
import { formatCurrency } from "@/lib/utils";
import ProductCard from "@/components/product/ProductCard";
import SizeGuideModal from "@/components/product/SizeGuideModal";
import {
  Heart,
  ShoppingBag,
  Zap,
  Ruler,
  ShieldCheck,
  Truck,
  RefreshCw,
  Sparkles,
  Check,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productsApi.getBySlug(slug),
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get(),
    enabled: !!user,
  });

  const isWishlisted = !!wishlist?.items?.some((item) => item.product_id === product?.id);

  useEffect(() => {
    if (product) {
      if (product.images.length > 0) {
        setSelectedImage(product.primary_image || product.images[0].image_url);
      }
      if (product.available_sizes.length > 0) {
        setSelectedSize(product.available_sizes[0]);
      }
      if (product.available_colors.length > 0) {
        setSelectedColor(product.available_colors[0]);
      }
    }
  }, [product]);

  const activeVariant = product?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor && v.is_active
  ) || product?.variants.find((v) => v.size === selectedSize && v.is_active) || product?.variants[0];

  const addToCartMutation = useMutation({
    mutationFn: async ({ variantId, qty }: { variantId: string; qty: number }) => {
      if (!user) {
        router.push(`/login?redirect=/product/${slug}`);
        throw new Error("Authentication required");
      }
      return cartApi.addItem(variantId, qty);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setFeedbackMsg("Added to cart successfully!");
      setTimeout(() => setFeedbackMsg(null), 3000);
    },
    onError: (err: any) => {
      setFeedbackMsg(err.message || "Could not add item to cart");
      setTimeout(() => setFeedbackMsg(null), 3500);
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        router.push(`/login?redirect=/product/${slug}`);
        return;
      }
      if (!product) return;
      if (isWishlisted) {
        return wishlistApi.remove(product.id);
      } else {
        return wishlistApi.add(product.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const handleAddToCart = () => {
    if (!activeVariant) return;
    addToCartMutation.mutate({ variantId: activeVariant.id, qty: quantity });
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push(`/login?redirect=/product/${slug}`);
      return;
    }
    if (!activeVariant) return;
    await addToCartMutation.mutateAsync({ variantId: activeVariant.id, qty: quantity });
    router.push("/checkout");
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-[3/4] bg-neutral-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-3/4" />
            <div className="h-6 bg-neutral-200 rounded w-1/4" />
            <div className="h-24 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-neutral-800">Product Not Found</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-full text-xs font-semibold uppercase"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const inStock = activeVariant ? activeVariant.stock_quantity > 0 : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16 pb-28 lg:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-14">
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[540px] pb-2 sm:pb-0">
            {product.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img.image_url)}
                className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                  selectedImage === img.image_url
                    ? "border-rose-600 shadow-md ring-2 ring-rose-100"
                    : "border-neutral-200 hover:border-rose-300"
                }`}
              >
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="relative flex-1 aspect-[3/4] rounded-3xl overflow-hidden bg-rose-50/20 border border-rose-100 shadow-lg">
            <img
              src={selectedImage || product.primary_image || "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=800"}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {Number(product.discount_percentage) > 0 && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                {product.discount_percentage}% OFF
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div>
            {product.category_name && (
              <span className="text-xs font-bold text-rose-600 tracking-widest uppercase mb-2 block">
                {product.category_name}
              </span>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">
              {product.name}
            </h1>
            {activeVariant && (
              <p className="text-xs text-neutral-400 mt-1">SKU: {activeVariant.sku}</p>
            )}
          </div>

          <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100/80 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900 font-sans">
              {formatCurrency(activeVariant ? activeVariant.price : product.selling_price)}
            </span>
            {Number(product.mrp) > Number(product.selling_price) && (
              <span className="text-base text-neutral-400 line-through">
                {formatCurrency(product.mrp)}
              </span>
            )}
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Inclusive of all taxes
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Select Color: <span className="text-rose-600 font-semibold">{selectedColor}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.available_colors.map((clr) => {
                const varForClr = product.variants.find((v) => v.color === clr);
                return (
                  <button
                    key={clr}
                    onClick={() => setSelectedColor(clr)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedColor === clr
                        ? "border-rose-600 bg-rose-50/60 text-rose-950 ring-1 ring-rose-600"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-rose-300"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                      style={{ backgroundColor: varForClr?.color_code || "#111827" }}
                    />
                    <span>{clr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Select Size: <span className="text-rose-600 font-semibold">{selectedSize}</span>
              </span>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.available_sizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-[48px] h-11 px-3 rounded-xl text-xs font-bold border transition-all ${
                    selectedSize === sz
                      ? "bg-rose-600 text-white border-rose-600 shadow-md"
                      : "bg-white text-neutral-800 border-neutral-200 hover:border-rose-300"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center border border-neutral-200 rounded-xl bg-white px-2 py-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-rose-600 font-bold"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-bold text-neutral-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-rose-600 font-bold"
              >
                +
              </button>
            </div>

            <div className="text-xs">
              {inStock ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  In Stock ({activeVariant?.stock_quantity} remaining)
                </span>
              ) : (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              )}
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3 bg-rose-100 text-rose-900 text-xs font-semibold rounded-xl border border-rose-300 text-center animate-in fade-in">
              {feedbackMsg}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || addToCartMutation.isPending}
              className="flex-1 py-3.5 px-6 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg hover:shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{addToCartMutation.isPending ? "Adding..." : "Add to Cart"}</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className="py-3.5 px-8 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Buy Now</span>
            </button>

            <button
              onClick={() => toggleWishlistMutation.mutate()}
              className={`p-3.5 rounded-full border transition-all ${
                isWishlisted
                  ? "bg-rose-50 border-rose-600 text-rose-600 shadow-sm"
                  : "bg-white border-neutral-200 text-neutral-700 hover:text-rose-600 hover:border-rose-300"
              }`}
              aria-label="Wishlist toggle"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
            </button>
          </div>

          <div className="pt-4 border-t border-rose-100 grid grid-cols-2 gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-rose-500" />
              <span>Fast 2-4 Day Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-rose-500" />
              <span>Free Size Exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>100% Genuine Fabrics</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Discreet Outer Packaging</span>
            </div>
          </div>

          <div className="pt-4 border-t border-rose-100 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                Description & Comfort Notes
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {product.product_details && (
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                  Key Features
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {product.product_details}
                </p>
              </div>
            )}

            {product.material && (
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                  Fabric & Composition
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600">{product.material}</p>
              </div>
            )}

            {product.care_instructions && (
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                  Care Instructions
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600">
                  {product.care_instructions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {product.related_products && product.related_products.length > 0 && (
        <div className="pt-12 border-t border-rose-100">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-8">
            Complete the Set & Related Styles
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {product.related_products.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Add-to-Cart Bar */}
      <div className="fixed bottom-[56px] sm:bottom-[60px] left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-rose-100 p-3 px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-neutral-500 font-medium">Total ({selectedSize || "Standard"})</span>
          <span className="text-base font-bold text-neutral-900 font-sans">
            {formatCurrency(activeVariant ? activeVariant.price : product.selling_price)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-[240px]">
          <button
            onClick={handleAddToCart}
            disabled={!inStock || addToCartMutation.isPending}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{addToCartMutation.isPending ? "Adding..." : "Add to Bag"}</span>
          </button>
        </div>
      </div>

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        categoryName={product.category_name || "Lingerie"}
      />
    </div>
  );
}

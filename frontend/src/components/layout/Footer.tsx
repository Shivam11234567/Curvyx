"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, RefreshCw, Truck, HeartHandshake, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800">
      <div className="border-b border-neutral-800 py-10 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-rose-950/50 text-rose-400 border border-rose-900/50">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Free Express Delivery</h4>
              <p className="text-xs text-neutral-400">On all prepaid orders over ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-rose-950/50 text-rose-400 border border-rose-900/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">100% Authentic</h4>
              <p className="text-xs text-neutral-400">Super-combed pure modal & cotton</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-rose-950/50 text-rose-400 border border-rose-900/50">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Discreet Packaging</h4>
              <p className="text-xs text-neutral-400">100% confidential sanitized delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-rose-950/50 text-rose-400 border border-rose-900/50">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Perfect Fit Guarantee</h4>
              <p className="text-xs text-neutral-400">Easy size exchanges for bras</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <span className="font-serif text-3xl font-bold tracking-widest text-white uppercase">
              Curvyx
            </span>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              Elevating women’s everyday innerwear with cloud-soft fabrics, precision ergonomics, and non-restrictive support designed for timeless comfort.
            </p>
            <div className="pt-2 text-xs text-neutral-400 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Indiranagar Flagship Boutique, Bengaluru, Karnataka</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-400" />
                <span>+91 (800) 123-4567 (Mon-Sat 9am - 7pm)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-400" />
                <span>concierge@curvyx.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li><Link href="/category/bras" className="hover:text-rose-400 transition-colors">Bras & Bralettes</Link></li>
              <li><Link href="/category/panties" className="hover:text-rose-400 transition-colors">Panties & Thongs</Link></li>
              <li><Link href="/category/lingerie-sets" className="hover:text-rose-400 transition-colors">Lingerie Sets & Babydolls</Link></li>
              <li><Link href="/category/nightwear-loungewear" className="hover:text-rose-400 transition-colors">Nightwear & Loungewear</Link></li>
              {/* Hidden: Corsets & Shapewear */}
              {/* <li><Link href="/category/corsets-shapewear" className="hover:text-rose-400 transition-colors">Corsets & Shapewear</Link></li> */}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li><Link href="/account/orders" className="hover:text-rose-400 transition-colors">Track Order</Link></li>
              <li><Link href="/cart" className="hover:text-rose-400 transition-colors">Shopping Cart</Link></li>
              <li><Link href="/wishlist" className="hover:text-rose-400 transition-colors">Wishlist</Link></li>
              <li><Link href="/account" className="hover:text-rose-400 transition-colors">My Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Newsletter
            </h4>
            <p className="text-xs text-neutral-400 mb-3">
              Subscribe for exclusive secret sales and bra-fitting insights.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold tracking-wider uppercase rounded-lg transition-colors"
              >
                Join Curvyx Club
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Curvyx Pvt Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-neutral-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-neutral-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-neutral-400 cursor-pointer">Shipping Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

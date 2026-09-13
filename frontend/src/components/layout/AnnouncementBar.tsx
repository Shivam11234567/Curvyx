"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Truck } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 text-rose-100 text-xs py-2 px-4 font-medium tracking-wide">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-rose-300" />
          <span>Complimentary delivery on orders above ₹999</span>
        </div>
        <div className="flex-1 sm:flex-initial text-center sm:text-right flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-rose-300" />
          <span>
            Use code <strong className="text-white tracking-widest uppercase">FIRST10</strong> for 10% off your first order
          </span>
          <Link href="/category/bras" className="underline hover:text-white ml-1 font-semibold">
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
}

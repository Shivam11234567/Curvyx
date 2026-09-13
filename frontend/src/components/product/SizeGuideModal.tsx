"use client";

import React from "react";
import { X, Ruler } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
}

export default function SizeGuideModal({ isOpen, onClose, categoryName = "Bras" }: SizeGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-rose-600" />
            <h3 className="font-serif text-xl font-bold text-neutral-900">
              {categoryName} Size Guide & Fit Chart
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm text-neutral-700">
          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100">
            <h4 className="font-semibold text-rose-950 mb-1">How to Measure for the Perfect Fit</h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              1. <strong>Underbust:</strong> Measure snugly around your ribcage directly beneath your bust where the bra band sits.
              <br />
              2. <strong>Overbust:</strong> Measure around the fullest part of your chest while wearing a non-padded bra.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">Band & Cup Size Matrix (Inches)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-rose-100 text-xs">
                <thead>
                  <tr className="bg-rose-100/50 text-rose-950 font-semibold">
                    <th className="border border-rose-200 p-2.5">Band Size</th>
                    <th className="border border-rose-200 p-2.5">Underbust (in)</th>
                    <th className="border border-rose-200 p-2.5">Cup B (Overbust)</th>
                    <th className="border border-rose-200 p-2.5">Cup C (Overbust)</th>
                    <th className="border border-rose-200 p-2.5">Cup D (Overbust)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  <tr>
                    <td className="border border-rose-100 p-2.5 font-medium">32</td>
                    <td className="border border-rose-100 p-2.5">27 - 29"</td>
                    <td className="border border-rose-100 p-2.5">31 - 32"</td>
                    <td className="border border-rose-100 p-2.5">32 - 33"</td>
                    <td className="border border-rose-100 p-2.5">33 - 34"</td>
                  </tr>
                  <tr className="bg-rose-50/20">
                    <td className="border border-rose-100 p-2.5 font-medium">34</td>
                    <td className="border border-rose-100 p-2.5">29 - 31"</td>
                    <td className="border border-rose-100 p-2.5">33 - 34"</td>
                    <td className="border border-rose-100 p-2.5">34 - 35"</td>
                    <td className="border border-rose-100 p-2.5">35 - 36"</td>
                  </tr>
                  <tr>
                    <td className="border border-rose-100 p-2.5 font-medium">36</td>
                    <td className="border border-rose-100 p-2.5">31 - 33"</td>
                    <td className="border border-rose-100 p-2.5">35 - 36"</td>
                    <td className="border border-rose-100 p-2.5">36 - 37"</td>
                    <td className="border border-rose-100 p-2.5">37 - 38"</td>
                  </tr>
                  <tr className="bg-rose-50/20">
                    <td className="border border-rose-100 p-2.5 font-medium">38</td>
                    <td className="border border-rose-100 p-2.5">33 - 35"</td>
                    <td className="border border-rose-100 p-2.5">37 - 38"</td>
                    <td className="border border-rose-100 p-2.5">38 - 39"</td>
                    <td className="border border-rose-100 p-2.5">39 - 40"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">Panties & Loungewear Sizing (Waist / Hips)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-rose-100 text-xs">
                <thead>
                  <tr className="bg-rose-100/50 text-rose-950 font-semibold">
                    <th className="border border-rose-200 p-2.5">Standard Size</th>
                    <th className="border border-rose-200 p-2.5">Waist (in)</th>
                    <th className="border border-rose-200 p-2.5">Hips (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  <tr>
                    <td className="border border-rose-100 p-2.5 font-medium">S</td>
                    <td className="border border-rose-100 p-2.5">26 - 28"</td>
                    <td className="border border-rose-100 p-2.5">35 - 37"</td>
                  </tr>
                  <tr className="bg-rose-50/20">
                    <td className="border border-rose-100 p-2.5 font-medium">M</td>
                    <td className="border border-rose-100 p-2.5">28 - 30"</td>
                    <td className="border border-rose-100 p-2.5">37 - 39"</td>
                  </tr>
                  <tr>
                    <td className="border border-rose-100 p-2.5 font-medium">L</td>
                    <td className="border border-rose-100 p-2.5">30 - 32"</td>
                    <td className="border border-rose-100 p-2.5">39 - 41"</td>
                  </tr>
                  <tr className="bg-rose-50/20">
                    <td className="border border-rose-100 p-2.5 font-medium">XL</td>
                    <td className="border border-rose-100 p-2.5">32 - 34"</td>
                    <td className="border border-rose-100 p-2.5">41 - 44"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded-full hover:bg-neutral-800 transition-colors uppercase tracking-wider"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

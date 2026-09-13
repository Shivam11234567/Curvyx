import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/common/QueryProvider";
import { AuthProvider } from "@/features/auth/AuthContext";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export const metadata: Metadata = {
  title: "ELORA Intimates | Modern Luxury Women's Innerwear & Lingerie",
  description:
    "Discover the ultimate blend of cloud-soft comfort and wire-free support with ELORA. Shop everyday bras, seamless t-shirt bras, modal panties, shapewear and luxury sleepwear.",
  keywords: [
    "women innerwear",
    "bras",
    "everyday bra",
    "t-shirt bra",
    "cotton panties",
    "shapewear",
    "sleepwear",
    "lingerie",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className="flex flex-col min-h-screen pb-16 lg:pb-0">
        <QueryProvider>
          <AuthProvider>
            <AnnouncementBar />
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <MobileBottomNav />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

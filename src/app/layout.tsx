import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Collectorate Quick Commerce",
  description: "Groceries and essentials delivered in minutes",
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <CartProvider>
          <Header />
          {/* Bottom padding keeps content clear of the phone tab bar. */}
          <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:pb-6 sm:pt-6">{children}</main>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}

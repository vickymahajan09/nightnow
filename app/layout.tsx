import type { Metadata } from "next";

import "./globals.css";

import { CartProvider } from "./context/CartContext";
import MobileNav from "./components/MobileNav";
import CartAddedPopup from "./components/CartAddedPopup";

export const metadata: Metadata = {
  title: "Night Now",
  description: "15 Minute Delivery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-white">

        <CartProvider>

          {children}

          <MobileNav />

          <CartAddedPopup />

        </CartProvider>

      </body>
    </html>
  );
}
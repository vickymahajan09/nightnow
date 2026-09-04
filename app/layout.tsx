import type { Metadata } from "next";

import "./globals.css";

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

import MobileNav from "./components/MobileNav";

import CartAddedPopup from "./components/CartAddedPopup";

import CustomerNotificationPopup from "./components/CustomerNotificationPopup";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nightnow.in"),
  title: {
    default: "NightNow — 15 Minute Grocery Delivery",
    template: "%s | NightNow",
  },
  description:
    "NightNow delivers groceries, snacks, and daily essentials to your door in 15 minutes. Order now for fast, reliable night delivery.",
  keywords: [
    "grocery delivery",
    "quick commerce",
    "15 minute delivery",
    "night delivery",
    "online groceries",
  ],
  openGraph: {
    title: "NightNow — 15 Minute Grocery Delivery",
    description:
      "Groceries, snacks, and daily essentials delivered to your door in 15 minutes.",
    siteName: "NightNow",
    type: "website",
    images: ["/icon.png"],
  },
  twitter: {
    card: "summary",
    title: "NightNow — 15 Minute Grocery Delivery",
    description:
      "Groceries, snacks, and daily essentials delivered to your door in 15 minutes.",
  },
  icons: {
    icon: "/favicon.ico",
  },
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
      {/*
        Poppins is loaded by the browser at runtime instead of through
        next/font/google. next/font downloads the font AT BUILD TIME,
        so any machine that can't reach fonts.googleapis.com (office
        wifi, VPN, antivirus HTTPS scanning) fails `npm run build`
        outright. This way the build never touches Google, and the
        font still renders exactly the same for customers.
      */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen bg-white">

        <CartProvider>
          <WishlistProvider>

            {children}

            <MobileNav />

            <CartAddedPopup />

            <CustomerNotificationPopup />

          </WishlistProvider>
        </CartProvider>

      </body>
    </html>
  );
}
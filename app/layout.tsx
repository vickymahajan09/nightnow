import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { CartProvider } from "./context/CartContext";
import BottomNav from "./components/BottomNav";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import InstallApp from "./components/InstallApp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Night Now",
  description: "10 Minute Delivery App",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-black text-white">

        <CartProvider>

          <ServiceWorkerRegister />

          {children}

          <InstallApp />

          <BottomNav />

        </CartProvider>

      </body>
    </html>
  );
}
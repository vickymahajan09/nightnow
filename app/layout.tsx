import type { Metadata } from "next";
import "./globals.css";

import { CartProvider } from "./context/CartContext";
import MobileNav from "./components/MobileNav";
import ThemeProvider from "./components/ThemeProvider";

export const metadata: Metadata = {
  title: "Night Now | Fast Delivery",
  description:
    "Night Now - Fast delivery for medicines, groceries and daily essentials.",
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
      <body>
        <ThemeProvider>
          <CartProvider>
            {children}
            <MobileNav />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
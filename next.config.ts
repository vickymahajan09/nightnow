import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin ESM-only hai. Ise bundle karne par Turbopack
  // require() se load karta hai aur ERR_REQUIRE_ESM aata hai.
  // External rakhne se Node seedha load karta hai.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
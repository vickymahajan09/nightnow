import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Night Now Admin",
  description: "Night Now Admin Panel",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}


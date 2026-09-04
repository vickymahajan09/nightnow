"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeliverIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/deliver/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <p className="text-sm font-semibold text-zinc-400">Loading...</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // ADMIN LOGIN KO GUARD NAHI KARNA
    if (pathname === "/admin/login") {
      setChecking(false);
      setAllowed(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        // LOGIN NAHI HAI
        if (!user) {
          setAllowed(false);
          setChecking(false);
          router.replace("/admin/login");
          return;
        }

        const adminEmail =
          process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        // ADMIN EMAIL CHECK
        if (
          adminEmail &&
          user.email &&
          user.email.toLowerCase() ===
            adminEmail.toLowerCase()
        ) {
          setAllowed(true);
          setChecking(false);
          return;
        }

        // WRONG USER
        setAllowed(false);
        setChecking(false);
        router.replace("/");
      }
    );

    return () => unsubscribe();
  }, [pathname, router]);

  // LOGIN PAGE
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // CHECKING
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-5 text-center">
          <div className="text-lg font-bold text-yellow-400">
            Night Now
          </div>

          <div className="mt-2 text-sm text-zinc-400">
            Checking Admin Access...
          </div>
        </div>
      </div>
    );
  }

  // NOT ALLOWED
  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          router.replace("/login");
          return;
        }

        const adminEmail =
          process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        if (
          adminEmail &&
          user.email?.toLowerCase() ===
            adminEmail.toLowerCase()
        ) {
          setAllowed(true);
        } else {
          router.replace("/");
        }

        setChecking(false);
      }
    );

    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-yellow-400">
          Checking Admin Access...
        </p>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
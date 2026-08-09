"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "../../services/authService";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await logoutUser();
      } catch (error) {
        console.error(error);
      } finally {
        router.replace("/login");
      }
    };

    logout();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="text-6xl">👋</div>

        <h1 className="mt-4 text-2xl font-bold">
          Logging out...
        </h1>
      </div>
    </main>
  );
}
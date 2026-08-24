"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import {
  auth,
} from "../lib/firebase";

type AdminGuardProps = {
  children: ReactNode;
};

export default function AdminGuard({
  children,
}: AdminGuardProps) {
  const router = useRouter();

  const [
    user,
    setUser,
  ] = useState<User | null>(
    null
  );

  const [
    checking,
    setChecking,
  ] = useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          if (!currentUser) {
            setUser(null);
            setChecking(false);

            router.replace(
              "/admin/login"
            );

            return;
          }

          setUser(
            currentUser
          );

          setChecking(false);
        }
      );

    return () =>
      unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-2xl">
            🌙
          </div>

          <p className="mt-4 text-sm font-black text-zinc-400">
            Checking admin access...
          </p>

        </div>

      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
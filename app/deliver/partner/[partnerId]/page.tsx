"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getPartnerCurrentJob } from "../../../services/deliveryTrackingService";

export default function PartnerPermanentLinkPage() {
  const params = useParams<{ partnerId: string }>();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [hasJob, setHasJob] = useState(false);

  useEffect(() => {
    const partnerId = params?.partnerId || "";
    if (!partnerId) return;

    let active = true;

    const check = async () => {
      try {
        const job = await getPartnerCurrentJob(partnerId);

        if (!active) return;

        if (job?.token) {
          setHasJob(true);
          // Reuses the exact same page/logic as a one-time link —
          // nothing had to be duplicated for this permanent version.
          router.replace(`/deliver/${job.token}`);
        } else {
          setHasJob(false);
          setChecking(false);
        }
      } catch (error) {
        console.error("Partner job lookup error:", error);
        if (active) setChecking(false);
      }
    };

    check();

    // No active job yet? Keep checking — admin might assign one any
    // moment while this stays open on the partner's phone.
    const interval = setInterval(check, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center text-white">
      <div>
        <p className="text-4xl">🛵</p>

        {checking ? (
          <p className="mt-4 text-sm font-bold text-zinc-400">
            Checking for your delivery...
          </p>
        ) : !hasJob ? (
          <>
            <p className="mt-4 text-lg font-black">
              No active delivery right now
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Keep this page open — it'll open automatically as soon as
              you're assigned an order.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

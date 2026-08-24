"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function CampaignSlugPage() {
  const params = useParams();

  const slug = String(
    params?.slug || ""
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-black">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/campaigns"
          className="text-sm font-bold text-zinc-500"
        >
          ← Back to Campaigns
        </Link>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black">
            Campaign
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            Campaign slug:
          </p>

          <p className="mt-1 break-all rounded-xl bg-zinc-100 p-3 font-bold">
            {slug || "No slug"}
          </p>

          <p className="mt-5 text-sm text-zinc-500">
            Campaign detail page is ready.
          </p>
        </div>
      </div>
    </main>
  );
}
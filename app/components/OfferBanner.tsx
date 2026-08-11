"use client";

export default function OfferBanner() {
  return (
    <section className="px-4 py-4">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-yellow-400 p-5 text-black">
        <div className="flex items-center justify-between gap-4">

          <div>
            <p className="text-sm font-black">
              ⚡ NIGHT NOW OFFER
            </p>

            <h2 className="mt-1 text-2xl font-black">
              First Order FREE Delivery 🎁
            </h2>

            <p className="mt-1 text-sm font-semibold">
              नए customers के लिए पहला order delivery FREE
            </p>

            <p className="mt-2 text-xs font-bold">
              Regular orders above ₹299 → FREE Delivery
            </p>
          </div>

          <div className="shrink-0 text-5xl">
            🛵
          </div>

        </div>
      </div>
    </section>
  );
}
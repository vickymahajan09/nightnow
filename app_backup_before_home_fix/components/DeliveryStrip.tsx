"use client";

export default function DeliveryStrip() {
  return (
    <section className="bg-black px-4 pb-3">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-sm font-bold text-white">
              Lightning Fast Delivery
            </span>
          </div>

          <span className="text-zinc-700">•</span>

          <div className="flex shrink-0 items-center gap-2">
            <span>🛵</span>
            <span className="text-sm text-zinc-300">
              Delivered at your doorstep
            </span>
          </div>

          <span className="text-zinc-700">•</span>

          <div className="flex shrink-0 items-center gap-2">
            <span>🔒</span>
            <span className="text-sm text-zinc-300">
              Secure Payments
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
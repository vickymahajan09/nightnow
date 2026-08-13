"use client";

export default function OfferBanner() {
  return (
    <section className="bg-[#f7f8fa] px-4 py-4">
      <div className="mx-auto max-w-7xl">

        <div className="grid gap-3 sm:grid-cols-3">

          {/* OFFER 1 */}

          <div className="rounded-2xl bg-yellow-50 p-4 shadow-sm ring-1 ring-yellow-100">
            <div className="text-2xl">
              ⚡
            </div>

            <h3 className="mt-2 font-black">
              Fast Delivery
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              Daily essentials at your doorstep.
            </p>
          </div>

          {/* OFFER 2 */}

          <div className="rounded-2xl bg-green-50 p-4 shadow-sm ring-1 ring-green-100">
            <div className="text-2xl">
              🎁
            </div>

            <h3 className="mt-2 font-black">
              First Order FREE
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              Enjoy free delivery on your first order.
            </p>
          </div>

          {/* OFFER 3 */}

          <div className="rounded-2xl bg-blue-50 p-4 shadow-sm ring-1 ring-blue-100">
            <div className="text-2xl">
              💰
            </div>

            <h3 className="mt-2 font-black">
              Great Offers
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              Save more with selected products.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
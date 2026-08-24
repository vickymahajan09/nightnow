"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">

      <div className="mx-auto max-w-3xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Home
        </Link>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm dark:bg-zinc-900">

          <h1 className="text-2xl font-black">
            Terms & Conditions
          </h1>

          <p className="mt-2 text-xs text-zinc-500">
            Please read these terms before using
            Night Now.
          </p>

          <div className="mt-6 space-y-6">

            <section>
              <h2 className="font-black">
                1. Use of Service
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                By using Night Now, you agree to
                provide accurate information and use
                the platform only for lawful purposes.
              </p>
            </section>

            <section>
              <h2 className="font-black">
                2. Orders
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Product availability, pricing,
                delivery time and offers may change
                from time to time.
              </p>
            </section>

            <section>
              <h2 className="font-black">
                3. Payment
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Payments may be processed through
                supported payment methods available
                during checkout.
              </p>
            </section>

            <section>
              <h2 className="font-black">
                4. Cancellation & Refund
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Eligible cancelled orders may receive
                refunds according to the applicable
                refund policy.
              </p>
            </section>

            <section>
              <h2 className="font-black">
                5. Account
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Customers are responsible for keeping
                their account information secure.
              </p>
            </section>

            <section>
              <h2 className="font-black">
                6. Changes
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Night Now may update these terms
                when required. Updated terms will be
                displayed on this page.
              </p>
            </section>

          </div>

        </section>

      </div>

    </main>
  );
}
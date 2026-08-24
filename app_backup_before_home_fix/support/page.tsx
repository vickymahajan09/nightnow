"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Night Now delivery kitne time me hogi?",
    a: "Available area aur product availability ke according delivery time show hoga.",
  },
  {
    q: "Order cancel kaise kare?",
    a: "My Orders me jaakar available cancellation option use karein.",
  },
  {
    q: "Payment kaise kar sakte hain?",
    a: "Checkout par available payment methods me se payment karein.",
  },
  {
    q: "Delivery address change kar sakte hain?",
    a: "Checkout se pehle saved address select ya update kar sakte hain.",
  },
  {
    q: "Product available nahi hai to kya karein?",
    a: "Support se contact karein ya similar product search karein.",
  },
];

export default function SupportPage() {
  const [open, setOpen] =
    useState<number | null>(null);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">

      <div className="mx-auto max-w-4xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-xs font-black text-yellow-600">
            NIGHT NOW
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Help & Support
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kisi bhi problem ke liye humse contact karein.
          </p>

        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">

          <a
            href="tel:8989855637"
            className="rounded-3xl bg-white p-6 shadow-sm"
          >
            <div className="text-4xl">
              📞
            </div>

            <h2 className="mt-4 text-xl font-black">
              Contact Support
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              8989855637
            </p>

            <div className="mt-4 rounded-xl bg-yellow-400 py-3 text-center font-black">
              Call Now
            </div>
          </a>

          <a
            href="https://wa.me/918989855637"
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl bg-white p-6 shadow-sm"
          >
            <div className="text-4xl">
              💬
            </div>

            <h2 className="mt-4 text-xl font-black">
              WhatsApp Support
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Chat with Night Now support
            </p>

            <div className="mt-4 rounded-xl bg-green-500 py-3 text-center font-black text-white">
              WhatsApp
            </div>
          </a>

        </div>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-2xl font-black">
            Frequently Asked Questions
          </h2>

          <div className="mt-5 space-y-3">

            {faqs.map(
              (faq, index) => (
                <div
                  key={faq.q}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >

                  <button
                    type="button"
                    onClick={() =>
                      setOpen(
                        open === index
                          ? null
                          : index
                      )
                    }
                    className="flex w-full items-center justify-between p-4 text-left font-black"
                  >
                    {faq.q}

                    <span>
                      {open === index
                        ? "−"
                        : "+"}
                    </span>
                  </button>

                  {open === index && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {faq.a}
                    </div>
                  )}

                </div>
              )
            )}

          </div>

        </section>

      </div>

    </main>
  );
}
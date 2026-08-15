"use client";

import Link from "next/link";

const contactMethods = [
  {
    icon: "💬",
    title: "WhatsApp Support",
    text: "Chat with Night Now support for order and account help.",
    href: "https://wa.me/919999999999",
  },
  {
    icon: "✉️",
    title: "Email Support",
    text: "Send your issue, order number or account query by email.",
    href: "mailto:support@nightnow.in",
  },
  {
    icon: "📞",
    title: "Customer Support",
    text: "Customer-care contact can be configured from the admin settings.",
    href: "/admin/settings",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 pb-24 text-black dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/profile" className="text-xs font-black text-zinc-500">
          ← Back to Profile
        </Link>

        <section className="mt-4 rounded-3xl bg-black p-6 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
            Night Now Support
          </p>
          <h1 className="mt-2 text-3xl font-black">Contact Us</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Order, delivery, payment, account ya profile related help ke liye contact karein.
          </p>
        </section>

        <div className="mt-4 space-y-3">
          {contactMethods.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-yellow-400 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-xl text-black">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.text}</p>
                </div>
                <span className="text-lg">→</span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-zinc-700 dark:border-yellow-900/40 dark:bg-yellow-950/20 dark:text-zinc-300">
          <p className="font-black text-black dark:text-white">Important</p>
          <p className="mt-1 text-xs leading-5">
            Replace the placeholder WhatsApp number above with the actual Night Now customer-care number before production.
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

export default function TrustBar() {
  const items = [
    {
      icon: "⚡",
      title: "Fast Delivery",
      text: "Get your order quickly",
    },
    {
      icon: "💯",
      title: "Quality Products",
      text: "Trusted products only",
    },
    {
      icon: "🔐",
      title: "Secure Payment",
      text: "100% secure checkout",
    },
    {
      icon: "📞",
      title: "24/7 Support",
      text: "We're here to help",
    },
  ];

  return (
    <section className="border-y border-zinc-800 bg-zinc-950 px-4 py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl bg-zinc-900 p-4"
          >
            <div className="text-3xl">
              {item.icon}
            </div>

            <h3 className="mt-3 text-sm font-black text-white">
              {item.title}
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
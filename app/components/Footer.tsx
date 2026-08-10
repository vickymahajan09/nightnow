import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="grid gap-8 md:grid-cols-3">

          {/* BRAND */}

          <div>
            <h2 className="text-2xl font-black text-yellow-400">
              Night Now
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Fast delivery, right when you need it.
            </p>

            <p className="mt-3 text-sm font-semibold text-yellow-400">
              आपकी जरूरत, हमारी जिम्मेदारी।
            </p>
          </div>

          {/* QUICK LINKS */}

          <div>
            <h3 className="font-bold">
              Quick Links
            </h3>

            <div className="mt-3 space-y-2 text-sm text-zinc-400">

              <Link
                href="/"
                className="block hover:text-yellow-400"
              >
                Home
              </Link>

              <Link
                href="/orders"
                className="block hover:text-yellow-400"
              >
                Orders
              </Link>

              <Link
                href="/cart"
                className="block hover:text-yellow-400"
              >
                Cart
              </Link>

              <Link
                href="/login"
                className="block hover:text-yellow-400"
              >
                Login
              </Link>

            </div>
          </div>

          {/* SUPPORT */}

          <div>
            <h3 className="font-bold">
              Support
            </h3>

            <p className="mt-3 text-sm text-zinc-400">
              Need help with your order?
            </p>

            <div className="mt-4 flex flex-col gap-3">

              <a
                href="https://wa.me/91XXXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-green-600 px-4 py-3 text-center font-bold text-white hover:bg-green-700"
              >
                💬 WhatsApp Support
              </a>

              <a
                href="tel:+91XXXXXXXXXX"
                className="rounded-xl bg-zinc-800 px-4 py-3 text-center font-bold hover:bg-zinc-700"
              >
                📞 Call Now
              </a>

            </div>

          </div>

        </div>

        <div className="mt-8 border-t border-zinc-800 pt-5 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Night Now. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
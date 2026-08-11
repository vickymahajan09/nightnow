import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-4 py-10 text-black">

      <div className="mx-auto max-w-7xl">

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">

          {/* BRAND */}

          <div>

            <h2 className="text-2xl font-black">
              Night
              <span className="text-yellow-500">
                Now
              </span>
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Fast delivery for everything
              you need, whenever you need it.
            </p>

            <p className="mt-3 text-sm font-bold">
              आपकी जरूरत, हमारी जिम्मेदारी।
            </p>

          </div>

          {/* SHOP */}

          <div>

            <h3 className="font-black">
              Shop
            </h3>

            <div className="mt-4 space-y-3 text-sm text-zinc-500">

              <Link
                href="/"
                className="block hover:text-black"
              >
                Home
              </Link>

              <Link
                href="/#products"
                className="block hover:text-black"
              >
                Products
              </Link>

              <Link
                href="/cart"
                className="block hover:text-black"
              >
                Cart
              </Link>

              <Link
                href="/orders"
                className="block hover:text-black"
              >
                Orders
              </Link>

            </div>

          </div>

          {/* ACCOUNT */}

          <div>

            <h3 className="font-black">
              Account
            </h3>

            <div className="mt-4 space-y-3 text-sm text-zinc-500">

              <Link
                href="/login"
                className="block hover:text-black"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="block hover:text-black"
              >
                Create Account
              </Link>

              <Link
                href="/profile"
                className="block hover:text-black"
              >
                Profile
              </Link>

            </div>

          </div>

          {/* SUPPORT */}

          <div>

            <h3 className="font-black">
              Need Help?
            </h3>

            <p className="mt-4 text-sm leading-6 text-zinc-500">
              Need help with your order?
              Contact Night Now support.
            </p>

            <div className="mt-4 space-y-2">

              <a
                href="https://wa.me/918989855637"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-green-700"
              >
                💬 WhatsApp Support
              </a>

              <a
                href="tel:+918989855637"
                className="block rounded-xl bg-black px-4 py-3 text-center text-sm font-black text-white hover:bg-zinc-800"
              >
                📞 Call Support
              </a>

            </div>

          </div>

        </div>

        <div className="mt-10 border-t border-zinc-200 pt-5 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} Night Now. All rights reserved.
        </div>

      </div>

    </footer>
  );
}
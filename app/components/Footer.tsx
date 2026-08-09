import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-800 bg-black px-4 py-10 text-white">

      <div className="mx-auto max-w-7xl">

        <div className="grid gap-8 md:grid-cols-3">

          <div>
            <h2 className="text-2xl font-black text-yellow-400">
              Night Now
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Fast and reliable delivery at your doorstep.
            </p>
          </div>

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

              <Link
                href="/register"
                className="block hover:text-yellow-400"
              >
                Create Account
              </Link>

            </div>
          </div>

          <div>
            <h3 className="font-bold">
              Support
            </h3>

            <p className="mt-3 text-sm text-zinc-400">
              Need help with your order?
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              Contact Night Now support.
            </p>
          </div>

        </div>

        <div className="mt-8 border-t border-zinc-800 pt-5 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Night Now. All rights reserved.
        </div>

      </div>

    </footer>
  );
}
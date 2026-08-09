import Link from "next/link";
import AdminGuard from "./AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-950 text-white">

        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black">

          <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3">

            <div className="flex min-w-max items-center gap-2">

              {/* LOGO */}

              <Link
                href="/admin"
                className="mr-3"
              >
                <span className="text-xl font-black text-yellow-400">
                  Night Now
                </span>

                <span className="ml-2 text-xs text-zinc-500">
                  ADMIN
                </span>
              </Link>


              {/* DASHBOARD */}

              <Link
                href="/admin"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
              >
                Dashboard
              </Link>


              {/* PRODUCTS */}

              <Link
                href="/admin/product"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
              >
                Products
              </Link>


              {/* CATEGORIES */}

              <Link
                href="/admin/categories"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
              >
                Categories
              </Link>


              {/* ORDERS */}

              <Link
                href="/admin/orders"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
              >
                Orders
              </Link>


              {/* COUPONS */}

              <Link
                href="/admin/coupons"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
              >
                Coupons
              </Link>


              {/* REVIEWS */}

              <Link
                href="/admin/reviews"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
              >
                Reviews
              </Link>


              {/* SETTINGS */}

              <Link
                href="/admin/settings"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
              >
                Settings
              </Link>


              {/* LOGOUT */}

              <Link
                href="/admin/logout"
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-700"
              >
                Logout
              </Link>

            </div>

          </div>

        </header>


        {/* ADMIN CONTENT */}

        <main>
          {children}
        </main>

      </div>
    </AdminGuard>
  );
}
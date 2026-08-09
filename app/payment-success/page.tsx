import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">

      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-8 text-center">

        <div className="text-7xl">
          ✅
        </div>

        <h1 className="mt-6 text-3xl font-black text-green-400">
          Payment Successful
        </h1>

        <p className="mt-3 text-zinc-400">
          Your Night Now order has been placed successfully.
        </p>

        <Link href="/orders">
          <button className="mt-7 w-full rounded-xl bg-yellow-400 py-4 font-bold text-black">
            View My Orders
          </button>
        </Link>

        <Link href="/">
          <button className="mt-3 w-full rounded-xl bg-zinc-800 py-4 font-bold">
            Continue Shopping
          </button>
        </Link>

      </div>

    </main>
  );
}
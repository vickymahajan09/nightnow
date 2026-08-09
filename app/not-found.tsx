import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-center text-white">

      <div>

        <div className="text-7xl">
          🔍
        </div>

        <h1 className="mt-6 text-5xl font-black">
          404
        </h1>

        <p className="mt-3 text-zinc-400">
          Page not found
        </p>

        <Link href="/">
          <button className="mt-8 rounded-xl bg-yellow-400 px-8 py-3 font-bold text-black">
            Back to Home
          </button>
        </Link>

      </div>

    </main>
  );
}
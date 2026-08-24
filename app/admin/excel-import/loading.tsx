export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="animate-pulse rounded-3xl bg-white p-8">
          <div className="h-8 w-64 rounded bg-zinc-200" />
          <div className="mt-4 h-4 w-96 max-w-full rounded bg-zinc-100" />

          <div className="mt-8 h-40 rounded-2xl bg-zinc-100" />
          <div className="mt-5 h-32 rounded-2xl bg-zinc-100" />
        </div>
      </div>
    </main>
  );
}
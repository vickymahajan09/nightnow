export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] p-5">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-8 w-72 rounded bg-zinc-200" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-100" />

        <div className="mt-8 h-24 rounded-3xl bg-white" />

        <div className="mt-5 h-64 rounded-3xl bg-white" />
      </div>
    </main>
  );
}
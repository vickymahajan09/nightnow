export default function QuickDeliveryVisual(){
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-950 shadow-lg">
      <img
        src="/nightnow.png.png"
        alt="Night Now fast delivery"
        className="h-[220px] w-full object-cover object-center md:h-[310px]"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 md:p-5">
        <div className="flex items-end justify-between gap-4 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-300">Fast delivery</p>
            <p className="mt-1 text-2xl font-black md:text-3xl">15 min ke andar*</p>
          </div>
          <span className="rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black text-black">24×7*</span>
        </div>
      </div>
    </div>
  );
}

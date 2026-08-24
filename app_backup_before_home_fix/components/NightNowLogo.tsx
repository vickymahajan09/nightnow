"use client";
import Link from "next/link";

export default function NightNowLogo({compact=false}:{compact?:boolean}){
  return (
    <Link href="/" className="inline-flex items-center gap-2 shrink-0" aria-label="Night Now Home">
      <img
        src="/nightnow.png.png"
        alt="Night Now"
        className={compact ? "h-10 w-16 object-contain" : "h-11 w-[118px] object-contain object-center"}
      />
      {!compact && <span className="sr-only">Night Now - 15 minute delivery</span>}
    </Link>
  );
}

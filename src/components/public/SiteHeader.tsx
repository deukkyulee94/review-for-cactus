"use client";

import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-semibold tracking-tight text-zinc-900"
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            priority
          />
          Cactus
        </Link>
      </div>
    </header>
  );
}

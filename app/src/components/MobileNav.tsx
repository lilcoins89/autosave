"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home", icon: "■" },
  { href: "/dashboard#sniper", label: "Sniper", icon: "⚡" },
  { href: "/dashboard#copy", label: "Copy", icon: "⎔" },
  { href: "/dashboard#dca", label: "DCA", icon: "↻" },
];

export function MobileNav() {
  const pathname = usePathname();
  if (!pathname?.startsWith("/dashboard")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center text-[10px] text-zinc-400 hover:text-white min-w-[64px] py-1"
          >
            <span className="text-base leading-none mb-0.5">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

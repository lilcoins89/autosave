"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { usePathname } from "next/navigation";
import { NetworkBadge } from "@/components/NetworkBadge";

export function Navbar() {
  const { publicKey } = useWallet();
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/dashboard");

  return (
    <header aria-label="Primary navigation" className="border-b border-[#1b3349] bg-[#07111f]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">A</div>
            AutoSave <span className="text-brand-400 text-xs font-medium">AURA</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <Link href="/dashboard" className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition ${isApp && pathname === "/dashboard" ? "bg-[#b7f34a] text-[#07100b]" : "border border-[#29404b] text-[#b7c8cc] hover:border-[#62e6d5] hover:text-[#62e6d5]"}`}>Dashboard</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block"><NetworkBadge /></div>
          {publicKey && <div className="hidden lg:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Safety Active</div>}
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}

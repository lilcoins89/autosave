"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { usePathname } from "next/navigation";
import { NetworkBadge } from "@/components/NetworkBadge";

export function Navbar() {
  const { publicKey } = useWallet();
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/dashboard");

  return (
    <header aria-label="Primary navigation" className="sticky top-0 z-40 border-b border-[#173238] bg-[#031014]/90 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] max-w-[1540px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#62efad] via-[#1ec89a] to-[#087d88] text-sm font-black text-[#031014] shadow-[0_0_24px_rgba(98,239,173,0.25)]">A</div>
            <span className="text-base font-semibold tracking-tight text-white">AutoSave</span> <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#62efad]">Powered by AURA</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <Link href="/dashboard" className={`rounded-lg px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition ${isApp && pathname === "/dashboard" ? "bg-[#0d5c4b] text-[#82ffc0] shadow-[inset_0_0_20px_rgba(98,239,173,0.12)]" : "text-[#8eaaa7] hover:bg-[#0d2528] hover:text-[#d9f4ed]"}`}>Dashboard</Link>
            <Link href="/dashboard#sniper" className="rounded-lg px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#8eaaa7] transition hover:bg-[#0d2528] hover:text-[#d9f4ed]">Trading Engine</Link>
            <Link href="/dashboard#portfolio" className="rounded-lg px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#8eaaa7] transition hover:bg-[#0d2528] hover:text-[#d9f4ed]">Portfolio</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block"><NetworkBadge /></div>
          {publicKey && <div className="hidden lg:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Safety Active</div>}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

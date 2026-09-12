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

  return <header className="sticky top-0 z-40 border-b border-[#5a4a30] bg-[#15130f]/95 backdrop-blur">
    <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <Link href="/" className="group flex items-center gap-3"><span className="flex size-9 items-center justify-center border border-[#d4a646] bg-[#762f2b] font-display text-lg text-[#f4ecdb] shadow-[inset_0_0_0_2px_rgba(244,236,219,.08)]">A</span><span><span className="block font-display text-base leading-none text-[#f4ecdb]">AutoSave</span><span className="font-mono text-[8px] uppercase tracking-[.2em] text-[#d4a646]">AURA capital desk</span></span></Link>
        {isApp && <nav className="hidden items-center gap-5 border-l border-[#5a4a30] pl-7 font-mono text-[9px] uppercase tracking-[.16em] md:flex"><Link href="/dashboard" className={pathname === "/dashboard" ? "text-[#d4a646]" : "text-[#a6987d] hover:text-[#f4ecdb]"}>Overview</Link><span className="text-[#6e5930]">/</span><span className="text-[#a6987d]">Private ledger</span></nav>}
      </div>
      <div className="flex items-center gap-3"><div className="hidden sm:block"><NetworkBadge /></div>{publicKey && <div className="hidden items-center gap-2 border border-[#6e5930] px-3 py-2 font-mono text-[9px] uppercase tracking-[.12em] text-[#afc3a0] lg:flex"><span className="size-1.5 rounded-full bg-[#afc3a0]" /> Safety active</div>}<WalletMultiButton /></div>
    </div>
  </header>;
}

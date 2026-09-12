"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { publicKey } = useWallet();
  const pathname = usePathname();

  const isApp = pathname?.startsWith("/dashboard");

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            AutoSave{" "}
            <span className="text-brand-400 text-xs font-medium">AURA</span>
          </Link>

          {isApp && (
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg font-medium ${
                  pathname === "/dashboard"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                Overview
              </Link>
              <Link
                href="/dashboard/policy"
                className={`px-3 py-1.5 rounded-lg font-medium ${
                  pathname === "/dashboard/policy"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                Policy
              </Link>
              <Link
                href="/dashboard/safety"
                className={`px-3 py-1.5 rounded-lg font-medium ${
                  pathname === "/dashboard/safety"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                Safety
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {publicKey && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Safety Active
            </div>
          )}
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}

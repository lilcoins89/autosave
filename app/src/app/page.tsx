"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  const { connected } = useWallet();

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.28),transparent)]" />
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Powered by AURA · Non-custodial
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Define your capital policy.
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              AURA keeps it safe & working.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Smart allocation, scored AutoBuy, a real Safety Engine, and an
            Opportunity Sniper that only fires when conditions actually agree.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {connected ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-4 text-base transition shadow-xl shadow-brand-600/30"
              >
                Open Dashboard
              </Link>
            ) : (
              <div className="scale-110">
                <WalletMultiButton />
              </div>
            )}
            <a
              href="#pillars"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-8 py-4 transition"
            >
              See the four pillars
            </a>
          </div>
        </div>
      </section>

      {/* Four Pillars */}
      <section id="pillars" className="py-24 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Four pillars of intelligent capital
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Everything runs under AURA. Safety is never optional.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <PillarCard
              label="01 · SMART SAVE"
              labelColor="text-brand-400"
              title="Capital Policy Engine"
              description="Deposit once. Define targets. AURA maintains them and protects the Reserve when risk rises."
            >
              <div className="bg-zinc-950 rounded-xl p-4 text-sm space-y-2 font-mono">
                <Row label="Reserve" value="40%" />
                <Row label="AutoBuy" value="25%" />
                <Row label="Liquidity" value="20%" />
                <Row label="Trading" value="10%" />
                <Row label="Opportunity" value="5%" />
              </div>
            </PillarCard>

            <PillarCard
              label="02 · AUTOBUY ENGINE"
              labelColor="text-cyan-400"
              title="Opportunity Score, not timers"
              description="Every potential buy is scored. Below your threshold → NO TRADE."
            >
              <div className="bg-zinc-950 rounded-xl p-4 text-sm font-mono space-y-1.5">
                <Row label="Liquidity" value="92" />
                <Row label="Volume" value="87" />
                <Row label="Momentum" value="81" />
                <Row label="Execution" value="96" />
                <Row label="Risk" value="18" valueClass="text-emerald-400" />
                <div className="border-t border-zinc-800 my-2" />
                <div className="flex justify-between font-semibold">
                  <span>AURA SCORE</span>
                  <span className="text-brand-400">88/100</span>
                </div>
                <div className="text-emerald-400 text-xs mt-1">ACTION: BUY</div>
              </div>
            </PillarCard>

            <PillarCard
              label="03 · SAFETY ENGINE"
              labelColor="text-emerald-400"
              title="The heart of the product"
              description="Token checks + execution simulation + portfolio limits. Kill Switch on breach."
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Daily Loss Limit" value="5%" />
                <Stat label="Max Position" value="3%" />
                <Stat label="Max Slippage" value="1%" />
                <Stat label="Min Liquidity" value="$100k" />
              </div>
            </PillarCard>

            <PillarCard
              label="04 · OPPORTUNITY SNIPER"
              labelColor="text-amber-400"
              title="Not a faster sniper. A smarter one."
              description="Only executes when multiple independent conditions, the Score, and Safety all agree. Uses Opportunity Reserve by default."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Capital that behaves the way you defined
          </h2>
          <p className="text-zinc-400 mb-8">
            Set the policy. Set the risk limits. Let AURA enforce both while
            hunting real opportunities.
          </p>
          {connected ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold px-10 py-4 text-lg transition shadow-xl shadow-brand-600/30"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="inline-block scale-110">
              <WalletMultiButton />
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-zinc-900 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            AutoSave <span className="text-brand-400 text-sm font-medium">AURA</span>
          </div>
          <div className="text-sm text-zinc-500">
            © 2026 AutoSave. Non-custodial. Safety first.
          </div>
          <a
            href="https://github.com/lilcoins89/autosave"
            className="text-sm text-zinc-400 hover:text-white transition"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
}

function PillarCard({
  label,
  labelColor,
  title,
  description,
  children,
}: {
  label: string;
  labelColor: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/20">
      <div className={`${labelColor} font-semibold text-sm mb-3`}>{label}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-zinc-400 mb-5 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 rounded-lg p-3">
      <div className="text-zinc-500 text-xs mb-1">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

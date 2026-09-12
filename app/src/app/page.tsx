"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Navbar } from "@/components/Navbar";

const pillars = [
  { mark: "◎", eyebrow: "01 / CAPITAL POLICY", title: "Give every dollar a job.", copy: "Set your reserve, liquidity, AutoBuy, and opportunity targets. AURA keeps allocations aligned as markets move.", tone: "text-[#58d6c0]" },
  { mark: "✦", eyebrow: "02 / AUTOBUY ENGINE", title: "Buy conviction, not candles.", copy: "Every opportunity is scored across liquidity, momentum, execution, and risk before a trade can happen.", tone: "text-[#8ba7ff]" },
  { mark: "＋", eyebrow: "03 / SAFETY ENGINE", title: "Safety is the product.", copy: "Token checks, simulated execution, portfolio limits, take-profit, stop-loss, and a kill switch work together.", tone: "text-[#58d6c0]" },
  { mark: "↗", eyebrow: "04 / OPPORTUNITY SNIPER", title: "Be early. Stay selective.", copy: "Watch new Solana launches without chasing noise. AURA acts only when score, liquidity, and safety agree.", tone: "text-[#f1c77b]" },
];

export default function HomePage() {
  const { connected } = useWallet();
  return <>
    <Navbar />
    <main>
      <section className="relative overflow-hidden border-b border-[#1b3349]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(88,214,192,0.12),transparent_38%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1b3349] bg-[#0b1a2b]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a7b9ca]">
            <span className="size-2 rounded-full bg-[#58d6c0] shadow-[0_0_12px_#58d6c0]" /> Solana native · non-custodial · AURA protected
          </div>
          <h1 className="max-w-5xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.06em] text-[#f4f7fb] sm:text-7xl lg:text-8xl">Make your capital<br /><span className="text-[#58d6c0]">calm, active, and safe.</span></h1>
          <p className="mt-8 max-w-2xl text-pretty text-base leading-7 text-[#8295a9] sm:text-xl">AutoSave gives your Solana capital a policy, a pulse, and a safety system — so you can compound without constantly watching the screen.</p>
          <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            {connected ? <Link href="/dashboard" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#58d6c0] px-6 py-3.5 font-semibold text-[#07111f] transition hover:brightness-110 sm:w-auto">Open your workspace <span aria-hidden="true">→</span></Link> : <div className="[&_.wallet-adapter-button]:!rounded-xl [&_.wallet-adapter-button]:!bg-[#58d6c0] [&_.wallet-adapter-button]:!text-[#07111f]"><WalletMultiButton /></div>}
            <a href="#pillars" className="inline-flex w-full items-center justify-center rounded-xl border border-[#1b3349] px-6 py-3.5 font-medium text-[#c2d0dc] transition hover:border-[#58d6c0]/60 hover:bg-[#0b1a2b] sm:w-auto">Explore the system</a>
          </div>
          <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-3 text-left sm:gap-8">
            <MiniMetric label="Network" value="Solana" /><MiniMetric label="Custody" value="You" /><MiniMetric label="Default" value="Paper first" />
          </div>
        </div>
      </section>
      <section id="pillars" className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#58d6c0]">The operating system</p><h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">A better relationship with risk.</h2></div><p className="max-w-sm text-sm leading-6 text-[#8295a9]">One engine, four layers of intelligence. Every decision stays observable, reversible, and yours.</p></div>
        <div className="grid gap-4 md:grid-cols-2">{pillars.map(({ mark, eyebrow, title, copy, tone }) => <article key={eyebrow} className="group rounded-2xl border border-[#1b3349] bg-[#0b1a2b]/70 p-7 transition hover:-translate-y-1 hover:border-[#58d6c0]/50 sm:p-9"><div className={`font-display text-2xl ${tone}`} aria-hidden="true">{mark}</div><p className={`mt-8 text-xs font-semibold tracking-[0.16em] ${tone}`}>{eyebrow}</p><h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{title}</h3><p className="mt-4 max-w-md text-sm leading-6 text-[#8295a9]">{copy}</p><div className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#c2d0dc]"><span className="text-[#58d6c0]" aria-hidden="true">✓</span> Visible by default</div></article>)}</div>
      </section>
      <section className="border-y border-[#1b3349] bg-[#0b1a2b]/55"><div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-28"><div className="font-display text-3xl text-[#58d6c0]" aria-hidden="true">◎</div><h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Your wallet. Your policy.<br /><span className="text-[#8295a9]">Your pace.</span></h2><p className="mt-6 max-w-xl leading-7 text-[#8295a9]">Start in paper mode, inspect every decision, then choose when — and how — to go live.</p>{connected ? <Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#58d6c0] px-6 py-3.5 font-semibold text-[#07111f]">Enter dashboard <span aria-hidden="true">→</span></Link> : <div className="mt-8 [&_.wallet-adapter-button]:!rounded-xl [&_.wallet-adapter-button]:!bg-[#58d6c0] [&_.wallet-adapter-button]:!text-[#07111f]"><WalletMultiButton /></div>}</div></section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-[#8295a9] sm:flex-row sm:items-center sm:justify-between"><div className="font-display font-semibold text-[#f4f7fb]">AutoSave <span className="text-[#58d6c0]">/ AURA</span></div><div>Solana-only · non-custodial · © 2026</div><a href="https://github.com/lilcoins89/autosave" target="_blank" rel="noreferrer" className="hover:text-[#f4f7fb]">View source</a></footer>
  </>;
}
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="border-l border-[#1b3349] pl-3"><div className="text-[10px] uppercase tracking-[0.16em] text-[#8295a9]">{label}</div><div className="mt-1 text-sm font-semibold text-[#f4f7fb] sm:text-base">{value}</div></div>; }

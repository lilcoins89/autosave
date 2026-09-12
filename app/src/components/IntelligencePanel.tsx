"use client";

import { useMemo, useState } from "react";

type Props = { address?: string; equity: number; mode: string; running: boolean };

export function IntelligencePanel({ address, equity, mode, running }: Props) {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("Ask AURA about a signal, wallet flow, or risk gate.");
  const [loading, setLoading] = useState(false);
  const [heliusState, setHeliusState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [walletFlow, setWalletFlow] = useState("Awaiting wallet intelligence");
  const context = useMemo(() => ({ equity, mode, running, walletFlow }), [equity, mode, running, walletFlow]);

  async function refreshHelius() {
    if (!address) return;
    setHeliusState("loading");
    const response = await fetch(`/api/helius?address=${encodeURIComponent(address)}`);
    const data = await response.json().catch(() => null);
    if (!response.ok) { setHeliusState("error"); setWalletFlow(data?.error ?? "Helius unavailable"); return; }
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];
    const inflow = transactions.filter((tx: { nativeTransfers?: Array<{ amount?: number }> }) => (tx.nativeTransfers?.[0]?.amount ?? 0) > 0).length;
    setHeliusState("ready"); setWalletFlow(`${transactions.length} recent wallet events · ${inflow} inflow signals`);
  }

  async function askCopilot(event: React.FormEvent) {
    event.preventDefault(); if (!prompt.trim()) return; setLoading(true);
    const response = await fetch("/api/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, context }) });
    const data = await response.json().catch(() => null); setAnswer(response.ok ? data.answer : data?.error ?? "Copilot unavailable"); setLoading(false);
  }

  return <section className="ledger-surface border border-[#6e5930] p-4 shadow-[0_18px_50px_rgba(0,0,0,.18)] sm:p-5">
    <div className="flex flex-col gap-3 border-b border-[#5a4a30] pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.24em] text-[#d4a646]">AURA intelligence register</p><h2 className="mt-1 font-display text-xl text-[#f4ecdb]">Helius telemetry <span className="text-[#a6987d]">·</span> Groq copilot</h2></div><button onClick={refreshHelius} disabled={!address || heliusState === "loading"} className="rounded-sm border border-[#80652c] px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#f2cf7a] transition hover:bg-[#3b3021] disabled:opacity-50">{heliusState === "loading" ? "Scanning…" : "Scan wallet"}</button></div>
    <div className="grid gap-4 pt-4 lg:grid-cols-[1fr_1.3fr]"><div className="border border-[#5a4a30] bg-[#211d16]/70 p-4"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#a6987d]">Helius live feed</p><p className="mt-3 text-sm text-[#f0e3c2]">{walletFlow}</p><p className="mt-2 text-xs leading-5 text-[#a6987d]">Wallet activity and token discovery inform the desk. Telemetry alone never places a trade.</p><span className={`mt-4 inline-flex border px-2 py-1 font-mono text-[9px] ${heliusState === "ready" ? "border-[#afc3a0] text-[#afc3a0]" : heliusState === "error" ? "border-[#c88278] text-[#c88278]" : "border-[#80652c] text-[#d4a646]"}`}>{heliusState === "ready" ? "CONNECTED" : heliusState === "error" ? "DEGRADED" : "READY TO SCAN"}</span></div><div className="border border-[#5a4a30] bg-[#211d16]/70 p-4"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#a6987d]">Groq copilot</p><p className="mt-3 min-h-12 text-sm leading-6 text-[#f0e3c2]">{answer}</p><form onSubmit={askCopilot} className="mt-4 flex gap-2"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Why is this signal safe?" className="min-w-0 flex-1 rounded-sm border border-[#6e5930] bg-[#15130f] px-3 py-2 text-sm text-[#f4ecdb] outline-none placeholder:text-[#8f8168] focus:border-[#d4a646]" /><button disabled={loading} className="rounded-sm bg-[#d4a646] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#21180b] disabled:opacity-50">{loading ? "…" : "Ask"}</button></form></div></div>
  </section>;
}

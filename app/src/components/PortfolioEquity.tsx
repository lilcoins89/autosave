"use client";

import { PortfolioLedger } from "@/hooks/usePortfolioLedger";

function fmt(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 && digits >= 0 ? "" : "";
  return `${sign}${n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })}`;
}

interface Props {
  ledger: PortfolioLedger;
  liveOnChainUsd: number | null;
  networkLabel: string;
}

export function PortfolioEquity({ ledger, liveOnChainUsd, networkLabel }: Props) {
  const { startingEquityUsd, realizedPnlUsd, equityUsd, events, recordGain, recordLoss, resetLedger } =
    ledger;

  const pnlPositive = realizedPnlUsd >= 0;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold">Portfolio Equity</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Gains add · Losses subtract · Same rules on {networkLabel}
          </p>
        </div>
        <button
          onClick={resetLedger}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          Reset ledger
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4">
          <div className="text-xs text-zinc-500 mb-1">Starting equity</div>
          <div className="text-xl font-bold">
            ${fmt(startingEquityUsd)}
          </div>
        </div>
        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4">
          <div className="text-xs text-zinc-500 mb-1">Realized PnL</div>
          <div
            className={`text-xl font-bold ${
              pnlPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {pnlPositive ? "+" : ""}${fmt(realizedPnlUsd)}
          </div>
        </div>
        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4">
          <div className="text-xs text-zinc-500 mb-1">Equity (after PnL)</div>
          <div className="text-xl font-bold text-brand-400">
            ${fmt(equityUsd)}
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500 mb-4">
        Live on-chain mark:{" "}
        <span className="text-zinc-300">
          ${fmt(liveOnChainUsd)}
        </span>{" "}
        · Equity = Starting + Realized PnL. Every gain is added; every loss is
        subtracted.
      </div>

      {/* Demo controls so the flow is visible before real execution is wired */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => recordGain(25, "Demo gain · profitable exit")}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition"
        >
          + Simulate gain $25
        </button>
        <button
          onClick={() => recordLoss(15, "Demo loss · stop / adverse move")}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition"
        >
          − Simulate loss $15
        </button>
        <button
          onClick={() => recordGain(8.4, "LP fee income")}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
        >
          + Fee income $8.40
        </button>
      </div>

      {/* Event log */}
      <div>
        <div className="text-sm font-medium mb-3">PnL log</div>
        {events.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            No gains or losses recorded yet. When trades or fees settle, they
            will appear here and update equity.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-zinc-950/50 border border-zinc-800/80"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.reason}</div>
                  <div className="text-xs text-zinc-500">
                    {e.timestamp.toLocaleString()} · {e.network}
                  </div>
                </div>
                <div
                  className={`font-semibold shrink-0 ml-3 ${
                    e.side === "gain" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {e.side === "gain" ? "+" : "−"}$
                  {e.amountUsd.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

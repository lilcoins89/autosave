"use client";

import { Position, ClosedTrade } from "@/hooks/usePositions";

interface Props {
  positions: Position[];
  closed: ClosedTrade[];
  unrealizedPnl: number;
  realizedPnl: number;
  onClose: (id: string, reason: string) => void;
  onSetRisk: (id: string, sl: number | null, tp: number | null) => void;
  onBumpMark: (id: string, factor: number) => void;
}

export function PositionsPanel({
  positions,
  closed,
  unrealizedPnl,
  realizedPnl,
  onClose,
  onSetRisk,
  onBumpMark,
}: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Positions & P&amp;L</h2>
        <div className="text-xs text-zinc-500">
          Unreal{" "}
          <span className={unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
            {unrealizedPnl >= 0 ? "+" : ""}
            ${unrealizedPnl.toFixed(2)}
          </span>
          {" · "}Real{" "}
          <span className={realizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
            {realizedPnl >= 0 ? "+" : ""}
            ${realizedPnl.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {positions.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-4">
            No open positions. Paper fills and live buys will show here.
          </p>
        )}
        {positions.map((p) => {
          const pnl = (p.markPriceUsd - p.entryPriceUsd) * p.quantity;
          const pct =
            p.entryPriceUsd > 0
              ? ((p.markPriceUsd - p.entryPriceUsd) / p.entryPriceUsd) * 100
              : 0;
          return (
            <div
              key={p.id}
              className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="font-medium">{p.symbol}</div>
                  <div className="text-xs text-zinc-500">
                    Entry ${p.entryPriceUsd.toFixed(4)} · Mark $
                    {p.markPriceUsd.toFixed(4)} · {p.source}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pct.toFixed(1)}%)
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => onSetRisk(p.id, 5, p.takeProfitPct)}
                  className="px-2 py-1 rounded bg-zinc-800"
                >
                  SL 5%
                </button>
                <button
                  onClick={() => onSetRisk(p.id, p.stopLossPct, 15)}
                  className="px-2 py-1 rounded bg-zinc-800"
                >
                  TP 15%
                </button>
                <button
                  onClick={() => onBumpMark(p.id, 1.05)}
                  className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400"
                >
                  Mark +5%
                </button>
                <button
                  onClick={() => onBumpMark(p.id, 0.95)}
                  className="px-2 py-1 rounded bg-red-500/15 text-red-400"
                >
                  Mark -5%
                </button>
                <button
                  onClick={() => onClose(p.id, "Manual close")}
                  className="px-2 py-1 rounded bg-zinc-800 text-zinc-300"
                >
                  Close
                </button>
              </div>
              {(p.stopLossPct !== null || p.takeProfitPct !== null) && (
                <div className="text-[10px] text-zinc-500 mt-2">
                  SL: {p.stopLossPct ?? "—"}% · TP: {p.takeProfitPct ?? "—"}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {closed.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">Closed trades</div>
          <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
            {closed.map((t) => (
              <div key={t.id} className="flex justify-between text-zinc-400">
                <span>{t.symbol} · {t.reason}</span>
                <span className={t.pnlUsd >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {t.pnlUsd >= 0 ? "+" : ""}${t.pnlUsd.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

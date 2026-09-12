"use client";

import { StrategyEvent } from "@/hooks/useAutoStrategies";

export function StrategyActivity({ events }: { events: StrategyEvent[] }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h3 className="font-semibold mb-4">Auto strategy activity</h3>
      {events.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">
          No sniper or copy events yet. Enable a strategy and activity will
          appear here.
        </p>
      ) : (
        <div className="space-y-3 text-sm max-h-80 overflow-y-auto">
          {events.map((e) => {
            const isBuy =
              e.type === "sniper_buy" || e.type === "copy_trade";
            const isSkip =
              e.type === "sniper_skip" || e.type === "copy_skip";
            return (
              <div key={e.id} className="flex gap-2">
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
                    isBuy
                      ? "bg-emerald-500/15 text-emerald-400"
                      : isSkip
                      ? "bg-zinc-800 text-zinc-400"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {e.type.replace("_", " ")}
                </span>
                <div className="min-w-0">
                  <div className="text-zinc-300">{e.detail}</div>
                  <div className="text-xs text-zinc-600">
                    {e.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

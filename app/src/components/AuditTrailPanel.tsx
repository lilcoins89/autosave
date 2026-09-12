"use client";

import { AuditEntry } from "@/hooks/useAuditTrail";

export function AuditTrailPanel({ entries }: { entries: AuditEntry[] }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
      <h3 className="font-semibold mb-3">Transaction & audit trail</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">
          Quotes, swaps, paper fills, DCA runs, and safety blocks will appear here.
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
          {entries.map((e) => (
            <div
              key={e.id}
              className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/80"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-zinc-500 uppercase tracking-wide">
                  {e.kind}
                </span>
                <span className="text-zinc-600">·</span>
                <span className={e.mode === "live" ? "text-emerald-500" : "text-cyan-500"}>
                  {e.mode}
                </span>
              </div>
              <div className="text-zinc-300">{e.message}</div>
              {e.signature && (
                <div className="text-zinc-600 truncate mt-0.5">tx: {e.signature}</div>
              )}
              <div className="text-zinc-600 mt-0.5">
                {new Date(e.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import { ExecutorKind } from "@/execution";

interface Props {
  kind: ExecutorKind;
  feeSol: number;
  onKindChange: (k: ExecutorKind) => void;
  onFeeChange: (f: number) => void;
}

export function ExecutorPanel({ kind, feeSol, onKindChange, onFeeChange }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
      <h3 className="font-semibold mb-1">Execution engine</h3>
      <p className="text-xs text-zinc-500 mb-4">
        Warp-style pluggable executors. Private keys never leave your wallet.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Executor</label>
          <select
            value={kind}
            onChange={(e) => onKindChange(e.target.value as ExecutorKind)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="default">Default RPC</option>
            <option value="warp">Warp (tx.warp.id)</option>
            <option value="jito">Jito bundles</option>
          </select>
        </div>

        {(kind === "warp" || kind === "jito") && (
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Tip / fee (SOL)
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={feeSol}
              onChange={(e) => onFeeChange(Number(e.target.value) || 0.001)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              Recommended ≥ 0.001 SOL for better inclusion.
            </p>
          </div>
        )}

        <div className="text-xs text-zinc-500 space-y-1 pt-1">
          {kind === "default" && (
            <p>Standard sendRawTransaction + confirm via your RPC.</p>
          )}
          {kind === "warp" && (
            <p>
              Signs fee + main tx locally, submits serialized txs to{" "}
              <code className="text-zinc-400">tx.warp.id</code>. No private key
              is sent. Improves landing under congestion.
            </p>
          )}
          {kind === "jito" && (
            <p>
              Sends tip + main tx as a Jito bundle to multiple block engines for
              MEV-aware inclusion.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

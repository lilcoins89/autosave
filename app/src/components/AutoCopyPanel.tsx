"use client";

import { useState } from "react";
import { AutoCopyConfig } from "@/hooks/useAutoStrategies";

interface Props {
  config: AutoCopyConfig;
  onChange: (patch: Partial<AutoCopyConfig>) => void;
  onAddWallet: (address: string, label: string, allocationPct: number) => void;
  onRemoveWallet: (id: string) => void;
  onToggleWallet: (id: string) => void;
  onSimulate: () => void;
}

export function AutoCopyPanel({
  config,
  onChange,
  onAddWallet,
  onRemoveWallet,
  onToggleWallet,
  onSimulate,
}: Props) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [alloc, setAlloc] = useState(25);

  const handleAdd = () => {
    if (!address.trim() || address.trim().length < 32) return;
    onAddWallet(address, label || "Trader", alloc);
    setAddress("");
    setLabel("");
    setAlloc(25);
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-cyan-400">⎔</span> Auto Copy Trading
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Automatically mirror trades from wallets you follow. Runs under
            Safety Engine limits — no manual clicking.
          </p>
        </div>
        <button
          onClick={() => onChange({ enabled: !config.enabled })}
          className={`shrink-0 relative w-12 h-7 rounded-full transition ${
            config.enabled ? "bg-brand-600" : "bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition ${
              config.enabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      <div
        className={`space-y-4 ${!config.enabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Max copy budget (USD)
            </label>
            <input
              type="number"
              min={1}
              value={config.maxCopyBudgetUsd}
              onChange={(e) =>
                onChange({ maxCopyBudgetUsd: Number(e.target.value) || 0 })
              }
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Max per trade (USD)
            </label>
            <input
              type="number"
              min={1}
              value={config.maxPerTradeUsd}
              onChange={(e) =>
                onChange({ maxPerTradeUsd: Number(e.target.value) || 0 })
              }
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Followed wallets */}
        <div>
          <div className="text-sm font-medium mb-2">Wallets you follow</div>
          {config.wallets.length === 0 ? (
            <p className="text-sm text-zinc-500 py-3">
              No wallets yet. Add a Solana address to copy automatically.
            </p>
          ) : (
            <div className="space-y-2 mb-3">
              {config.wallets.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{w.label}</div>
                    <div className="text-xs text-zinc-500 truncate">
                      {w.address.slice(0, 6)}...{w.address.slice(-6)} ·{" "}
                      {w.allocationPct}% of budget
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onToggleWallet(w.id)}
                      className={`text-xs px-2 py-1 rounded-md ${
                        w.enabled
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {w.enabled ? "On" : "Off"}
                    </button>
                    <button
                      onClick={() => onRemoveWallet(w.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          <div className="p-3 rounded-xl border border-dashed border-zinc-700 space-y-2">
            <input
              placeholder="Solana wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
            <div className="flex gap-2">
              <input
                placeholder="Label (e.g. Alpha whale)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={alloc}
                onChange={(e) => setAlloc(Number(e.target.value) || 1)}
                className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                title="Allocation %"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            config.enabled
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {config.enabled ? "Copying automatically" : "Copy trading off"}
        </span>
        <button
          onClick={onSimulate}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
        >
          Simulate copy
        </button>
      </div>
    </section>
  );
}

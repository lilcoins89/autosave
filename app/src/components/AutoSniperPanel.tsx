"use client";

import { AutoSniperConfig } from "@/hooks/useAutoStrategies";

interface Props {
  config: AutoSniperConfig;
  onChange: (patch: Partial<AutoSniperConfig>) => void;
  onSimulate: () => void;
}

export function AutoSniperPanel({ config, onChange, onSimulate }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-amber-400">⚡</span> Auto Sniper
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Automatically buys new Solana tokens that pass score + liquidity +
            safety filters. Not a dumb sniper — AURA decides.
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
        className={`grid sm:grid-cols-2 gap-4 ${
          !config.enabled ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <Field label="Min AURA Score">
          <select
            value={config.minScore}
            onChange={(e) => onChange({ minScore: Number(e.target.value) })}
            className="input"
          >
            <option value={60}>60+</option>
            <option value={70}>70+</option>
            <option value={75}>75+ (default)</option>
            <option value={80}>80+</option>
            <option value={85}>85+</option>
          </select>
        </Field>
        <Field label="Min Liquidity">
          <select
            value={config.minLiquidityUsd}
            onChange={(e) =>
              onChange({ minLiquidityUsd: Number(e.target.value) })
            }
            className="input"
          >
            <option value={25_000}>$25k+</option>
            <option value={50_000}>$50k+ (default)</option>
            <option value={100_000}>$100k+</option>
            <option value={250_000}>$250k+</option>
          </select>
        </Field>
        <Field label="Max position (USD)">
          <input
            type="number"
            min={1}
            value={config.maxPositionUsd}
            onChange={(e) =>
              onChange({ maxPositionUsd: Number(e.target.value) || 0 })
            }
            className="input"
          />
        </Field>
        <div className="flex flex-col gap-3 justify-end pb-1">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useOpportunityReserveOnly}
              onChange={(e) =>
                onChange({ useOpportunityReserveOnly: e.target.checked })
              }
              className="rounded border-zinc-600"
            />
            Opportunity Reserve only
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.requireRevokedAuthorities}
              onChange={(e) =>
                onChange({ requireRevokedAuthorities: e.target.checked })
              }
              className="rounded border-zinc-600"
            />
            Require revoked mint/freeze
          </label>
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
          {config.enabled ? "Armed · auto-executing" : "Disarmed"}
        </span>
        <button
          onClick={onSimulate}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
        >
          Simulate tick
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: #09090b;
          border: 1px solid #3f3f46;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #fafafa;
        }
        .input:focus {
          outline: none;
          border-color: #7c3aed;
        }
      `}</style>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

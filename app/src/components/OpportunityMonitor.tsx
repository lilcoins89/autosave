"use client";

import { useTokenOpportunities, OpportunityFilters } from "@/hooks/useTokenOpportunities";

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function ageLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return `${h}h ago`;
}

export function OpportunityMonitor() {
  const {
    opportunities,
    totalDetected,
    filters,
    setFilters,
    loading,
    error,
    lastUpdated,
    refetch,
  } = useTokenOpportunities();

  const updateFilter = <K extends keyof OpportunityFilters>(
    key: K,
    value: OpportunityFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-amber-400">⚡</span> New Token Monitor
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Only tokens that pass liquidity & safety filters ·{" "}
            {totalDetected} detected → {opportunities.length} pass
            {lastUpdated && ` · ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-50 self-start"
        >
          {loading ? "Scanning…" : "Scan now"}
        </button>
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Min Liquidity (USD)</label>
          <select
            value={filters.minLiquidityUsd}
            onChange={(e) => updateFilter("minLiquidityUsd", Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          >
            <option value={25_000}>$25k+</option>
            <option value={50_000}>$50k+ (default)</option>
            <option value={100_000}>$100k+</option>
            <option value={250_000}>$250k+</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Min AURA Score</label>
          <select
            value={filters.minScore}
            onChange={(e) => updateFilter("minScore", Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          >
            <option value={50}>50+</option>
            <option value={60}>60+ (default)</option>
            <option value={70}>70+</option>
            <option value={80}>80+</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={filters.requireRevokedAuthorities}
              onChange={(e) =>
                updateFilter("requireRevokedAuthorities", e.target.checked)
              }
              className="rounded border-zinc-600 bg-zinc-900 text-brand-500 focus:ring-brand-500"
            />
            Require revoked mint/freeze
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {opportunities.length === 0 && !loading && (
          <div className="text-center py-10 text-sm text-zinc-500">
            No new tokens currently pass your liquidity & safety filters.
            <br />
            <span className="text-xs">
              Try lowering min liquidity or score, or wait for the next scan.
            </span>
          </div>
        )}

        {opportunities.map((t) => (
          <div
            key={t.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                {t.symbol.slice(0, 4)}
              </div>
              <div className="min-w-0">
                <div className="font-medium flex items-center gap-2 flex-wrap">
                  {t.symbol}
                  <span className="text-xs font-normal text-zinc-500">{t.name}</span>
                </div>
                <div className="text-xs text-zinc-500 truncate">
                  {t.mint.slice(0, 6)}...{t.mint.slice(-6)} · {ageLabel(t.ageMinutes)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-sm flex-wrap">
              <div className="text-right">
                <div className="text-xs text-zinc-500">Liquidity</div>
                <div className="font-medium text-emerald-400">
                  {formatUsd(t.liquidityUsd)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Vol 24h</div>
                <div className="font-medium">{formatUsd(t.volume24hUsd)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Score</div>
                <div className="font-medium text-brand-400">{t.score}</div>
              </div>
              <div className="flex flex-col gap-0.5 text-[10px]">
                <span
                  className={
                    t.mintAuthorityRevoked ? "text-emerald-400" : "text-red-400"
                  }
                >
                  Mint {t.mintAuthorityRevoked ? "revoked" : "open"}
                </span>
                <span
                  className={
                    t.freezeAuthorityRevoked ? "text-emerald-400" : "text-red-400"
                  }
                >
                  Freeze {t.freezeAuthorityRevoked ? "revoked" : "open"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-600 mt-4">
        Monitor filters for <strong className="text-zinc-500">good liquidity only</strong>.
        Demo data is shown until a real indexer (Helius webhooks / pool creation
        logs / Birdeye) is connected. Low-liquidity and open-authority tokens are
        excluded by default.
      </p>
    </section>
  );
}

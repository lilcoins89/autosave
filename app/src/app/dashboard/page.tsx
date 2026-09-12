"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSolanaBalances } from "@/hooks/useSolanaBalances";
import { usePortfolioLedger } from "@/hooks/usePortfolioLedger";
import { NetworkBadge } from "@/components/NetworkBadge";
import { OpportunityMonitor } from "@/components/OpportunityMonitor";
import { PortfolioEquity } from "@/components/PortfolioEquity";
import {
  getNetwork,
  getNetworkLabel,
  isCustomRpc,
} from "@/lib/rpc";

// Reference SOL price for USD marks on all networks
const SOL_PRICE_USD = 180;

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { sol, tokens, loading, error, lastUpdated, refetch } =
    useSolanaBalances();

  const network = getNetwork();
  const networkLabel = getNetworkLabel(network);

  const usdc = tokens.find((t) => t.symbol === "USDC");
  const liveOnChainUsd =
    sol !== null ? (sol ?? 0) * SOL_PRICE_USD + (usdc?.uiAmount ?? 0) : null;

  const ledger = usePortfolioLedger(liveOnChainUsd, !loading && sol !== null);

  if (!connected) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6">
          <h1 className="text-2xl font-bold">Connect your wallet to continue</h1>
          <p className="text-zinc-400 text-center max-w-md">
            AutoSave is non-custodial. Connect a wallet on{" "}
            <span className="text-white font-medium">{networkLabel}</span> to
            access live balances and the AURA dashboard.
          </p>
          <NetworkBadge showRpcHint />
          <WalletMultiButton />
        </div>
      </>
    );
  }

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  const otherTokens = tokens.filter((t) => t.symbol !== "USDC").slice(0, 5);

  // Display equity prefers ledger (starting + PnL); falls back to live mark
  const displayEquity = ledger.equityUsd ?? liveOnChainUsd ?? 0;
  const pnl = ledger.realizedPnlUsd;

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Portfolio Overview</h1>
            <p className="text-zinc-500 text-sm">
              Connected as {shortAddress}
              {lastUpdated && (
                <span className="ml-2">
                  · Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <NetworkBadge showRpcHint />
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {network !== "mainnet-beta" && (
          <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            You are on <strong>{networkLabel}</strong>. Balances and equity flow
            work the same as mainnet. USD uses a reference SOL price ($
            {SOL_PRICE_USD}).
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Failed to load on-chain data: {error}
          </div>
        )}

        {/* Top metrics — equity reflects gains/losses */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Equity (after PnL)"
            value={
              loading && sol === null
                ? "…"
                : `$${displayEquity.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}`
            }
            sub={
              pnl === 0
                ? "No realized PnL yet"
                : `PnL ${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}`
            }
            subColor={pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-zinc-500"}
            valueColor="text-brand-400"
          />
          <MetricCard
            label="SOL Balance"
            value={
              loading && sol === null
                ? "…"
                : sol !== null
                ? `${sol.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })} SOL`
                : "—"
            }
            sub={`≈ $${((sol ?? 0) * SOL_PRICE_USD).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}`}
            subColor="text-zinc-500"
          />
          <MetricCard
            label="USDC Balance"
            value={
              usdc
                ? `$${usdc.uiAmount.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}`
                : loading
                ? "…"
                : "$0.00"
            }
            sub="On-chain"
            subColor="text-zinc-500"
            valueColor="text-emerald-400"
          />
          <MetricCard
            label="Realized PnL"
            value={
              `${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}`
            }
            sub="Gains add · Losses subtract"
            subColor="text-zinc-500"
            valueColor={pnl >= 0 ? "text-emerald-400" : "text-red-400"}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Equity ledger — core of gain/loss flow */}
            <PortfolioEquity
              ledger={ledger}
              liveOnChainUsd={liveOnChainUsd}
              networkLabel={networkLabel}
            />

            <OpportunityMonitor />

            {/* Holdings */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">On-chain Holdings</h2>
                <span className="text-xs text-zinc-500">
                  {tokens.length} token account{tokens.length !== 1 ? "s" : ""} ·{" "}
                  {networkLabel}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 font-bold text-sm">
                      SOL
                    </div>
                    <div>
                      <div className="font-medium">Solana</div>
                      <div className="text-sm text-zinc-500">Native</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {sol !== null
                        ? sol.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })
                        : "…"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      ≈ $
                      {((sol ?? 0) * SOL_PRICE_USD).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                </div>

                {usdc && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 font-bold text-xs">
                        USDC
                      </div>
                      <div>
                        <div className="font-medium">USD Coin</div>
                        <div className="text-sm text-zinc-500">
                          {usdc.mint.slice(0, 4)}...{usdc.mint.slice(-4)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      ${
                      usdc.uiAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                )}

                {otherTokens.map((t) => (
                  <div
                    key={t.mint}
                    className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/60 border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-700/40 flex items-center justify-center text-zinc-300 font-bold text-xs">
                        {t.symbol.slice(0, 4)}
                      </div>
                      <div>
                        <div className="font-medium">{t.symbol}</div>
                        <div className="text-sm text-zinc-500">
                          {t.mint.slice(0, 4)}...{t.mint.slice(-4)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      {t.uiAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Safety Engine
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Daily Loss Limit</span>
                  <span>5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Max Position</span>
                  <span>3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Max Slippage</span>
                  <span>1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Min Liquidity</span>
                  <span>$50k+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kill Switch</span>
                  <span className="text-emerald-400">OFF</span>
                </div>
              </div>
              <button className="w-full mt-5 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition">
                Activate Kill Switch
              </button>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="font-semibold mb-3">Network & RPC</h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <div className="flex justify-between">
                  <span>Network</span>
                  <span className="text-zinc-200">{networkLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span>RPC</span>
                  <span className="text-zinc-200">
                    {isCustomRpc() ? "Custom (Helius etc.)" : "Public cluster"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function MetricCard({
  label,
  value,
  sub,
  subColor = "text-zinc-500",
  valueColor = "",
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="text-sm text-zinc-400 mb-1">{label}</div>
      <div className={`text-2xl sm:text-3xl font-bold ${valueColor}`}>{value}</div>
      <div className={`text-xs mt-1 ${subColor}`}>{sub}</div>
    </div>
  );
}

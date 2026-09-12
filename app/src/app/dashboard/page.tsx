"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSolanaBalances } from "@/hooks/useSolanaBalances";
import { isCustomRpc } from "@/lib/rpc";

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { sol, tokens, loading, error, lastUpdated, refetch } =
    useSolanaBalances();

  if (!connected) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6">
          <h1 className="text-2xl font-bold">Connect your wallet to continue</h1>
          <p className="text-zinc-400 text-center max-w-md">
            AutoSave is non-custodial. Connect Phantom, Solflare, or another
            supported wallet to access your dashboard and live balances.
          </p>
          <WalletMultiButton />
        </div>
      </>
    );
  }

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  const usdc = tokens.find((t) => t.symbol === "USDC");
  const otherTokens = tokens.filter((t) => t.symbol !== "USDC").slice(0, 5);

  // Rough portfolio estimate (SOL * mock price + USDC). Replace with real price feed later.
  const MOCK_SOL_PRICE = 180;
  const estimatedUsd =
    (sol ?? 0) * MOCK_SOL_PRICE + (usdc?.uiAmount ?? 0);

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
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
          <div className="flex items-center gap-3">
            {!isCustomRpc() && (
              <span className="text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                Using public RPC — set NEXT_PUBLIC_RPC_URL for Helius
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Failed to load on-chain data: {error}
          </div>
        )}

        {/* Live Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Est. Portfolio (USD)"
            value={
              loading && sol === null
                ? "…"
                : `$${estimatedUsd.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}`
            }
            sub="SOL @ mock $180 + USDC"
            subColor="text-zinc-500"
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
            sub="On-chain"
            subColor="text-zinc-500"
            valueColor="text-brand-400"
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
            label="Kill Switch"
            value="OFF"
            sub="All systems normal"
            subColor="text-zinc-500"
            valueColor="text-emerald-400"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Token Holdings */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">On-chain Holdings</h2>
                <span className="text-xs text-zinc-500">
                  {tokens.length} token account{tokens.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {/* SOL row */}
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
                      {sol !== null
                        ? `≈ $${(sol * MOCK_SOL_PRICE).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}`
                        : ""}
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
                        <div className="text-sm text-zinc-500">EPjF...Dt1v</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {usdc.uiAmount.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-zinc-500">Stable</div>
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
                    <div className="text-right">
                      <div className="font-medium">
                        {t.uiAmount.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {!loading && tokens.length === 0 && sol === 0 && (
                  <p className="text-sm text-zinc-500 py-4 text-center">
                    No significant balances found on this wallet.
                  </p>
                )}
              </div>
            </section>

            {/* Capital Policy (still policy-layer UI) */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">
                  Smart Save · Capital Policy
                </h2>
                <button className="text-sm text-brand-400 hover:text-brand-300">
                  Edit Policy
                </button>
              </div>
              <div className="space-y-4">
                <PolicyBar label="Reserve" current={41.2} target={40} color="bg-brand-500" />
                <PolicyBar label="AutoBuy" current={23.8} target={25} color="bg-cyan-500" />
                <PolicyBar label="Liquidity" current={21.1} target={20} color="bg-emerald-500" />
                <PolicyBar label="Trading" current={9.4} target={10} color="bg-amber-500" />
                <PolicyBar label="Opportunity Reserve" current={4.5} target={5} color="bg-purple-500" />
              </div>
              <p className="text-xs text-zinc-500 mt-4">
                Policy targets are illustrative until on-chain positions & AURA
                state are fully wired. Live balances above are real.
              </p>
            </section>

            {/* Opportunity Score */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">
                  AutoBuy · Latest Opportunity Score
                </h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                  BUY
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3 font-mono text-sm">
                  <ScoreRow label="Liquidity" value={92} />
                  <ScoreRow label="Volume" value={87} />
                  <ScoreRow label="Momentum" value={81} />
                  <ScoreRow label="Execution" value={96} />
                  <ScoreRow label="Risk" value={18} good />
                  <div className="border-t border-zinc-800 pt-3 flex justify-between font-semibold">
                    <span>AURA SCORE</span>
                    <span className="text-brand-400 text-lg">88/100</span>
                  </div>
                </div>
                <div className="bg-zinc-950 rounded-xl p-4 text-sm">
                  <div className="text-zinc-500 text-xs mb-2">Evaluation</div>
                  <div className="font-medium mb-3">
                    High-quality SOL-related opportunity
                  </div>
                  <div className="text-zinc-500 text-xs mb-1">Your threshold</div>
                  <div className="mb-3">75</div>
                  <div className="text-emerald-400 font-medium">
                    → Conditions met. Safety Engine cleared.
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right */}
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
                  <span>$100k</span>
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
              <h3 className="font-semibold mb-4">Recent AURA Decisions</h3>
              <div className="space-y-4 text-sm">
                <Decision action="BUY" score="88" detail="SOL opportunity · 2h ago" positive />
                <Decision action="NO TRADE" score="61" detail="Low liquidity + high risk · 5h ago" />
                <Decision action="REBALANCE" detail="Restored Reserve target · 1d ago" positive />
                <Decision action="SNIPER SKIP" detail="Failed holder concentration · 1d ago" warn />
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="font-semibold mb-3">RPC Status</h3>
              <p className="text-sm text-zinc-400">
                {isCustomRpc()
                  ? "Using custom RPC (Helius or other) via NEXT_PUBLIC_RPC_URL."
                  : "Using public Solana RPC. For production, set NEXT_PUBLIC_RPC_URL to your Helius endpoint."}
              </p>
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

function PolicyBar({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span>
          {current}% <span className="text-zinc-600">/ {target}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${Math.min(current, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  good,
}: {
  label: string;
  value: number;
  good?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={good ? "text-emerald-400" : ""}>{value}</span>
    </div>
  );
}

function Decision({
  action,
  score,
  detail,
  positive,
  warn,
}: {
  action: string;
  score?: string;
  detail: string;
  positive?: boolean;
  warn?: boolean;
}) {
  const color = positive
    ? "text-emerald-400"
    : warn
    ? "text-amber-400"
    : "text-zinc-400";
  return (
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`font-medium ${color}`}>{action}</span>
        {score && <span className="text-zinc-500 text-xs">Score {score}</span>}
      </div>
      <div className="text-zinc-400">{detail}</div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Navbar } from "@/components/Navbar";
import { NetworkBadge } from "@/components/NetworkBadge";
import { ModeToggle } from "@/components/ModeToggle";
import { OpportunityMonitor } from "@/components/OpportunityMonitor";
import { PortfolioEquity } from "@/components/PortfolioEquity";
import { AutoSniperPanel } from "@/components/AutoSniperPanel";
import { AutoCopyPanel } from "@/components/AutoCopyPanel";
import { StrategyActivity } from "@/components/StrategyActivity";
import { DcaPanel } from "@/components/DcaPanel";
import { PositionsPanel } from "@/components/PositionsPanel";
import { AuditTrailPanel } from "@/components/AuditTrailPanel";
import { ExecutorPanel } from "@/components/ExecutorPanel";
import { useSolanaBalances } from "@/hooks/useSolanaBalances";
import { usePortfolioLedger } from "@/hooks/usePortfolioLedger";
import { useAutoStrategies } from "@/hooks/useAutoStrategies";
import { useTradingMode } from "@/hooks/useTradingMode";
import { usePositions } from "@/hooks/usePositions";
import { useDcaSchedules } from "@/hooks/useDcaSchedules";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import { useExecutor } from "@/hooks/useExecutor";
import { getNetwork, getNetworkLabel, isCustomRpc } from "@/lib/rpc";
import {
  getJupiterQuote,
  assertSwapSafe,
  buildJupiterSwapTransaction,
  NATIVE_SOL_MINT,
  USDC_MINT_MAINNET,
  SwapGuardError,
} from "@/lib/jupiter";
import { withRetry } from "@/lib/retry";
import { VersionedTransaction } from "@solana/web3.js";

const SOL_PRICE_USD = 180;

export default function DashboardPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { sol, tokens, loading, error, lastUpdated, refetch } = useSolanaBalances();

  const network = getNetwork();
  const networkLabel = getNetworkLabel(network);
  const { mode, setMode, isPaper } = useTradingMode();
  const { entries: audit, log } = useAuditTrail(mode);
  const { kind, setKind, feeSol, setFeeSol, execute, executorLabel } = useExecutor();

  const usdc = tokens.find((t) => t.symbol === "USDC");
  const liveOnChainUsd =
    sol !== null ? (sol ?? 0) * SOL_PRICE_USD + (usdc?.uiAmount ?? 0) : null;

  const ledger = usePortfolioLedger(liveOnChainUsd, !loading && sol !== null);

  const {
    sniper,
    copy,
    events: strategyEvents,
    updateSniper,
    updateCopy,
    addCopyWallet,
    removeCopyWallet,
    toggleCopyWallet,
    simulateSniperTick,
    simulateCopyTick,
  } = useAutoStrategies();

  const {
    positions,
    closed,
    openPosition,
    updateMark,
    closePosition,
    setRiskRules,
    evaluateRisk,
    unrealizedPnl,
    realizedPnl,
  } = usePositions();

  const { schedules, addSchedule, toggle, remove, markExecuted } = useDcaSchedules();

  useEffect(() => {
    const id = setInterval(() => {
      const hits = evaluateRisk();
      hits.forEach((h) => {
        closePosition(h.id, h.reason);
        if (h.pnlUsd >= 0) ledger.recordGain(h.pnlUsd, h.reason);
        else ledger.recordLoss(Math.abs(h.pnlUsd), h.reason);
        log("tp_sl", h.reason, { pnlUsd: h.pnlUsd });
      });
    }, 5000);
    return () => clearInterval(id);
  }, [evaluateRisk, closePosition, ledger, log]);

  async function executeBuy(opts: {
    symbol: string;
    mint: string;
    amountUsd: number;
    source: "manual" | "sniper" | "copy" | "dca" | "paper";
  }) {
    if (!publicKey) return;
    const maxSlippageBps = 100;
    const maxPriceImpactPct = 1.5;

    if (isPaper) {
      const entry = SOL_PRICE_USD;
      openPosition({
        symbol: opts.symbol,
        mint: opts.mint,
        entryPriceUsd: entry,
        quantity: opts.amountUsd / entry,
        markPriceUsd: entry,
        stopLossPct: 5,
        takeProfitPct: 15,
        source: "paper",
      });
      log("paper_fill", `Paper buy ${opts.symbol} ~$${opts.amountUsd}`, opts);
      return;
    }

    try {
      log("swap_quote", `Quoting ${opts.symbol} for ~$${opts.amountUsd} via ${executorLabel}`);
      const amountRaw = Math.round(opts.amountUsd * 1e6);
      const quote = await withRetry(
        () =>
          getJupiterQuote({
            inputMint: USDC_MINT_MAINNET,
            outputMint: opts.mint === "SOL" ? NATIVE_SOL_MINT : opts.mint,
            amount: amountRaw,
            slippageBps: maxSlippageBps,
          }),
        { retries: 2, onRetry: (n) => log("info", `Quote retry ${n}`) }
      );
      assertSwapSafe(quote, maxPriceImpactPct);

      const swapTxB64 = await buildJupiterSwapTransaction({
        quoteRaw: quote.raw,
        userPublicKey: publicKey.toBase58(),
      });
      const tx = VersionedTransaction.deserialize(Buffer.from(swapTxB64, "base64"));

      log("swap_submit", `Submitting via ${executorLabel}`);

      // Warp / Jito / Default pluggable path
      if (kind === "warp" || kind === "jito") {
        const result = await execute(tx);
        if (!result.confirmed) {
          log("swap_fail", result.error ?? "Executor failed", { ...opts, executor: kind });
          return;
        }
        openPosition({
          symbol: opts.symbol,
          mint: opts.mint,
          entryPriceUsd: SOL_PRICE_USD,
          quantity: opts.amountUsd / SOL_PRICE_USD,
          markPriceUsd: SOL_PRICE_USD,
          stopLossPct: 5,
          takeProfitPct: 15,
          source: opts.source,
        });
        log("swap_success", `Confirmed via ${executorLabel}`, opts, result.signature);
        return;
      }

      // Default RPC path
      const sig = await withRetry(
        async () => {
          const s = await sendTransaction(tx, connection, {
            maxRetries: 2,
            skipPreflight: false,
          });
          await connection.confirmTransaction(s, "confirmed");
          return s;
        },
        { retries: 2, onRetry: (n) => log("info", `Send retry ${n}`) }
      );

      openPosition({
        symbol: opts.symbol,
        mint: opts.mint,
        entryPriceUsd: SOL_PRICE_USD,
        quantity: opts.amountUsd / SOL_PRICE_USD,
        markPriceUsd: SOL_PRICE_USD,
        stopLossPct: 5,
        takeProfitPct: 15,
        source: opts.source,
      });
      log("swap_success", `Swap confirmed (default RPC)`, opts, sig);
    } catch (e) {
      const msg = e instanceof SwapGuardError ? e.message : String(e);
      log("swap_fail", msg, opts);
      if (e instanceof SwapGuardError) log("safety_block", msg);
    }
  }

  function handleDcaRun(id: string) {
    const s = schedules.find((x) => x.id === id);
    if (!s || !s.enabled) return;
    if (s.spentUsd + s.amountUsd > s.maxTotalUsd) {
      log("safety_block", `DCA ${s.label} would exceed max total`);
      return;
    }
    executeBuy({
      symbol: s.outputSymbol,
      mint: s.outputMint,
      amountUsd: s.amountUsd,
      source: "dca",
    });
    markExecuted(id, s.amountUsd);
    log("dca_run", `DCA ran ${s.label} $${s.amountUsd}`, { id });
  }

  if (!connected) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-center">Connect your Solana wallet</h1>
          <p className="text-zinc-400 text-center max-w-md text-sm">
            Non-custodial · Solana-only · Start in <strong>Paper</strong> mode to practice safely.
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
  const displayEquity = ledger.equityUsd ?? liveOnChainUsd ?? 0;
  const pnl = ledger.realizedPnlUsd;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Portfolio</h1>
            <p className="text-zinc-500 text-xs sm:text-sm">
              {shortAddress}
              {lastUpdated && ` · ${lastUpdated.toLocaleTimeString()}`}
              {` · ${executorLabel}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ModeToggle mode={mode} onChange={setMode} />
            <NetworkBadge showRpcHint />
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? "…" : "Refresh"}
            </button>
          </div>
        </div>

        {isPaper && (
          <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs sm:text-sm text-cyan-200">
            <strong>Paper mode</strong> — trades are simulated. Switch to Live only when ready.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Metric label="Equity" value={`$${displayEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} sub={pnl === 0 ? "No PnL" : `PnL ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`} subColor={pnl >= 0 ? "text-emerald-400" : "text-red-400"} valueColor="text-brand-400" />
          <Metric label="SOL" value={sol !== null ? `${sol.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : "…"} sub={`≈ $${((sol ?? 0) * SOL_PRICE_USD).toFixed(0)}`} />
          <Metric label="USDC" value={usdc ? `$${usdc.uiAmount.toFixed(2)}` : "$0"} valueColor="text-emerald-400" />
          <Metric label="Unrealized" value={`${unrealizedPnl >= 0 ? "+" : ""}$${unrealizedPnl.toFixed(2)}`} valueColor={unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div id="sniper">
              <AutoSniperPanel config={sniper} onChange={updateSniper} onSimulate={simulateSniperTick} />
            </div>
            <div id="copy">
              <AutoCopyPanel
                config={copy}
                onChange={updateCopy}
                onAddWallet={addCopyWallet}
                onRemoveWallet={removeCopyWallet}
                onToggleWallet={toggleCopyWallet}
                onSimulate={simulateCopyTick}
              />
            </div>
            <DcaPanel
              schedules={schedules}
              onAdd={addSchedule}
              onToggle={toggle}
              onRemove={remove}
              onRunPaper={handleDcaRun}
              isPaper={isPaper}
            />
            <PositionsPanel
              positions={positions}
              closed={closed}
              unrealizedPnl={unrealizedPnl}
              realizedPnl={realizedPnl}
              onClose={(id, reason) => {
                const pos = positions.find((p) => p.id === id);
                closePosition(id, reason);
                if (pos) {
                  const p = (pos.markPriceUsd - pos.entryPriceUsd) * pos.quantity;
                  if (p >= 0) ledger.recordGain(p, reason);
                  else ledger.recordLoss(Math.abs(p), reason);
                }
              }}
              onSetRisk={setRiskRules}
              onBumpMark={(id, factor) => {
                const pos = positions.find((p) => p.id === id);
                if (pos) updateMark(id, pos.markPriceUsd * factor);
              }}
            />
            <PortfolioEquity ledger={ledger} liveOnChainUsd={liveOnChainUsd} networkLabel={networkLabel} />
            <OpportunityMonitor />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <ExecutorPanel
              kind={kind}
              feeSol={feeSol}
              onKindChange={setKind}
              onFeeChange={setFeeSol}
            />
            <StrategyActivity events={strategyEvents} />
            <AuditTrailPanel entries={audit} />
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safety
              </h3>
              <div className="space-y-2 text-sm">
                <Row k="Max slippage" v="1%" />
                <Row k="Max price impact" v="1.5%" />
                <Row k="Executor" v={executorLabel} />
                <Row k="Mode" v={mode} />
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 text-sm text-zinc-400">
              <div className="flex justify-between mb-1"><span>Network</span><span className="text-zinc-200">{networkLabel}</span></div>
              <div className="flex justify-between mb-1"><span>RPC</span><span className="text-zinc-200">{isCustomRpc() ? "Custom" : "Public"}</span></div>
              <div className="flex justify-between"><span>Chain</span><span className="text-zinc-200">Solana only</span></div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function Metric({
  label, value, sub, subColor = "text-zinc-500", valueColor = "",
}: { label: string; value: string; sub?: string; subColor?: string; valueColor?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
      <div className="text-xs sm:text-sm text-zinc-400 mb-1">{label}</div>
      <div className={`text-lg sm:text-2xl font-bold ${valueColor}`}>{value}</div>
      {sub && <div className={`text-[10px] sm:text-xs mt-1 ${subColor}`}>{sub}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{k}</span>
      <span>{v}</span>
    </div>
  );
}
